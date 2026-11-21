import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  JobApplicationsClient, SwaggerException,
  CreateJobApplicationCommand, UpdateJobApplicationCommand,
  type JobApplicationDto, type JobApplicationsVm,
} from '../web-api-client';

const client = new JobApplicationsClient();

// Must match the C# enums ApplicationStatus and WorkArrangement.
const APPLIED = 1;
const REMOTE = 2;

interface Filters {
  status: string;
  workArrangement: string;
  technology: string;
  maxCommute: string;
}

// The form keeps every field as text, the way the inputs give it, and converts once on save.
interface Form {
  id: number | null;
  company: string;
  jobTitle: string;
  adUrl: string;
  location: string;
  commuteMinutes: string;
  workArrangement: string;
  status: string;
  dateApplied: string;
  salaryMin: string;
  salaryMax: string;
  contact: string;
  technologies: string;
  jobDescription: string;
  notes: string;
}

const emptyForm: Form = {
  id: null, company: '', jobTitle: '', adUrl: '', location: '', commuteMinutes: '',
  workArrangement: '1', status: '0', dateApplied: '', salaryMin: '', salaryMax: '',
  contact: '', technologies: '', jobDescription: '', notes: '',
};

const noFilters: Filters = { status: '', workArrangement: '', technology: '', maxCommute: '' };

const text = (v: string | undefined | null) => v ?? '';
const num = (v: number | undefined | null) => (v === undefined || v === null ? '' : String(v));
const toNumber = (v: string) => (v.trim() === '' ? undefined : Number(v));
const toText = (v: string) => (v.trim() === '' ? undefined : v.trim());

// Dates travel as yyyy-mm-dd. Built from the parts so the time zone can't shift the day.
const toDateInput = (d: Date | undefined) =>
  d ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}` : '';
// Sent as local midnight, because the generated client formats the date in local time.
const fromDateInput = (v: string) => {
  if (!v) return undefined;
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const todayInput = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const money = (v: number) => `$${Math.round(v / 1000)}k`;
function salary(a: JobApplicationDto) {
  if (a.salaryMin && a.salaryMax) return `${money(a.salaryMin)}–${money(a.salaryMax)}`;
  if (a.salaryMin) return `from ${money(a.salaryMin)}`;
  if (a.salaryMax) return `up to ${money(a.salaryMax)}`;
  return '';
}

function toForm(a: JobApplicationDto): Form {
  return {
    id: a.id ?? null,
    company: text(a.company), jobTitle: text(a.jobTitle), adUrl: text(a.adUrl), location: text(a.location),
    commuteMinutes: num(a.commuteMinutes), workArrangement: num(a.workArrangement), status: num(a.status),
    dateApplied: toDateInput(a.dateApplied), salaryMin: num(a.salaryMin), salaryMax: num(a.salaryMax),
    contact: text(a.contact), technologies: (a.technologies ?? []).join(', '),
    jobDescription: text(a.jobDescription), notes: text(a.notes),
  };
}

function fields(f: Form) {
  return {
    company: f.company, jobTitle: f.jobTitle, adUrl: toText(f.adUrl), location: toText(f.location),
    commuteMinutes: toNumber(f.commuteMinutes), workArrangement: Number(f.workArrangement), status: Number(f.status),
    dateApplied: fromDateInput(f.dateApplied), salaryMin: toNumber(f.salaryMin), salaryMax: toNumber(f.salaryMax),
    contact: toText(f.contact), notes: toText(f.notes), jobDescription: toText(f.jobDescription),
    technologies: f.technologies.split(',').map(t => t.trim()).filter(t => t !== ''),
  };
}

// Validation errors come back as { errors: { fieldName: ["message"] } }. Keys are stored
// lower-case so the lookup works whichever casing the server uses.
function errorsFrom(e: unknown): Record<string, string[]> {
  if (e instanceof SwaggerException) {
    try {
      const errors: Record<string, string[]> | undefined = JSON.parse(e.response).errors;
      if (errors) return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k.toLowerCase(), v]));
    } catch { /* not JSON */ }
  }
  return { '': ['Could not save. Please try again.'] };
}

export function Applications() {
  const [vm, setVm] = useState<JobApplicationsVm | null>(null);
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async (f: Filters) => {
    try {
      setVm(await client.getJobApplications(
        toNumber(f.status), toNumber(f.workArrangement), toText(f.technology), toNumber(f.maxCommute)));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    client.getJobApplications(undefined, undefined, undefined, undefined)
      .then(result => { if (!cancelled) setVm(result); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, []);

  const changeFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    load(merged);
  };

  const openForm = (f: Form) => {
    setForm(f);
    setErrors({});
    dialogRef.current?.showModal();
  };

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (form.id === null) {
        await client.createJobApplication(new CreateJobApplicationCommand(fields(form)));
      } else {
        await client.updateJobApplication(form.id, new UpdateJobApplicationCommand({ id: form.id, ...fields(form) }));
      }
      dialogRef.current?.close();
      await load(filters);
    } catch (err) {
      setErrors(errorsFrom(err));
    }
  };

  const remove = async (a: JobApplicationDto) => {
    if (a.id === undefined) return;
    try { await client.deleteJobApplication(a.id); await load(filters); } catch (e) { console.error(e); }
  };

  // Moving to Applied or later needs a date; today is the sensible default.
  const setStatus = (value: string) => setForm(f => ({
    ...f,
    status: value,
    dateApplied: Number(value) >= APPLIED && !f.dateApplied ? todayInput() : f.dateApplied,
  }));

  const quickStatus = async (a: JobApplicationDto, value: string) => {
    const f = { ...toForm(a), status: value };
    const withDate = Number(value) >= APPLIED && !f.dateApplied
      ? { ...f, dateApplied: todayInput() } : f;
    try {
      await client.updateJobApplication(a.id!, new UpdateJobApplicationCommand({ id: a.id, ...fields(withDate) }));
      await load(filters);
    } catch (e) { console.error(e); }
  };

  if (!vm) return <span aria-busy="true">Loading&hellip;</span>;

  const statuses = vm.statuses ?? [];
  const arrangements = vm.workArrangements ?? [];
  const items = vm.items ?? [];
  const top = vm.topTechnologies ?? [];
  const maxCount = Math.max(1, ...top.map(t => t.count ?? 0));
  const label = (list: typeof statuses, id: number | undefined) => list.find(l => l.id === id)?.title ?? '';
  const err = (field: string) => errors[field.toLowerCase()]?.[0];
  const input = (field: keyof Form) => ({
    value: form[field] ?? '',
    onChange: (e: { target: { value: string } }) => setForm(f => ({ ...f, [field]: e.target.value })),
  });

  return (
    <>
      <div className="apps-head">
        <div>
          <h1>Applications</h1>
          <p>{items.length} shown · newest first</p>
        </div>
        <button onClick={() => openForm(emptyForm)}><Plus size={18} /> Add application</button>
      </div>

      <div className="apps-layout">
        <aside className="apps-side">
          <h2>Top skills</h2>
          {top.length === 0 && <p className="apps-muted">Tag your applications to see which skills come up most.</p>}
          <ul className="skill-bars">
            {top.map(t => (
              <li key={t.name}>
                <button className={`skill ${filters.technology.toUpperCase() === t.name?.toUpperCase() ? 'active' : ''}`}
                  onClick={() => changeFilters({ technology: filters.technology === t.name ? '' : t.name ?? '' })}>
                  <span className="skill-name">{t.name}</span>
                  <span className="skill-bar" style={{ width: `${((t.count ?? 0) / maxCount) * 100}%` }} />
                  <span className="skill-count">{t.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="apps-main">
          <div className="apps-filters">
            <label>Status
              <select value={filters.status} onChange={e => changeFilters({ status: e.target.value })}>
                <option value="">Any</option>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </label>
            <label>Work
              <select value={filters.workArrangement} onChange={e => changeFilters({ workArrangement: e.target.value })}>
                <option value="">Any</option>
                {arrangements.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </label>
            <label>Max commute (min)
              <input type="number" min={0} max={600} value={filters.maxCommute} placeholder="Any"
                onChange={e => changeFilters({ maxCommute: e.target.value })} />
            </label>
            {filters.technology && (
              <button className="secondary outline chip" onClick={() => changeFilters({ technology: '' })}>
                {filters.technology} <X size={14} />
              </button>
            )}
          </div>

          {items.length === 0 && <p className="apps-muted">No applications match. Add one, or clear the filters.</p>}

          {items.map(a => (
            <article key={a.id} className="app-card" data-status={a.status}>
              <div className="app-card-top">
                <div>
                  <h3>{a.company}</h3>
                  <p className="app-title">{a.jobTitle}</p>
                </div>
                <select aria-label={`Status for ${a.company}`} className="app-status" value={a.status}
                  onChange={e => quickStatus(a, e.target.value)}>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <p className="app-facts">
                <span>{label(arrangements, a.workArrangement)}</span>
                {a.location && <span>{a.location}</span>}
                {a.workArrangement !== REMOTE && a.commuteMinutes != null && <span>{a.commuteMinutes} min commute</span>}
                {salary(a) && <span>{salary(a)}</span>}
                {a.dateApplied && <span>applied {toDateInput(a.dateApplied)}</span>}
              </p>
              {(a.technologies ?? []).length > 0 && (
                <p className="app-tags">{a.technologies!.map(t => <span key={t} className="tag">{t}</span>)}</p>
              )}
              <div className="app-actions">
                {a.adUrl && <a href={a.adUrl} target="_blank" rel="noreferrer">View ad</a>}
                <button className="icon-btn" aria-label={`Edit ${a.company}`} onClick={() => openForm(toForm(a))}><Pencil size={18} /></button>
                <button className="icon-btn" aria-label={`Delete ${a.company}`} onClick={() => remove(a)}><Trash2 size={18} /></button>
              </div>
            </article>
          ))}
        </section>
      </div>

      <dialog ref={dialogRef}>
        <article className="app-form">
          <header>
            <h3>{form.id === null ? 'Add application' : 'Edit application'}</h3>
            <button rel="prev" aria-label="Close" onClick={() => dialogRef.current?.close()}></button>
          </header>
          <form onSubmit={save} noValidate>
            {err('') && <p className="error">{err('')}</p>}
            <div className="form-row">
              <label>Company<input id="company" {...input('company')} aria-invalid={err('Company') ? true : undefined} />{err('Company') && <small>{err('Company')}</small>}</label>
              <label>Job title<input id="jobTitle" {...input('jobTitle')} aria-invalid={err('JobTitle') ? true : undefined} />{err('JobTitle') && <small>{err('JobTitle')}</small>}</label>
            </div>
            <div className="form-row">
              <label>Status
                <select id="status" value={form.status} onChange={e => setStatus(e.target.value)}>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </label>
              <label>Date applied<input id="dateApplied" type="date" {...input('dateApplied')} aria-invalid={err('DateApplied') ? true : undefined} />{err('DateApplied') && <small>{err('DateApplied')}</small>}</label>
            </div>
            <div className="form-row">
              <label>Work
                <select id="workArrangement" {...input('workArrangement')}>
                  {arrangements.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </label>
              <label>Location<input id="location" {...input('location')} placeholder="e.g. Brisbane CBD" /></label>
              <label>Commute (min)<input id="commuteMinutes" type="number" min={0} max={600} {...input('commuteMinutes')} aria-invalid={err('CommuteMinutes') ? true : undefined} />{err('CommuteMinutes') && <small>{err('CommuteMinutes')}</small>}</label>
            </div>
            <div className="form-row">
              <label>Salary from ($/yr)<input id="salaryMin" type="number" min={0} step={1000} {...input('salaryMin')} /></label>
              <label>Salary to ($/yr)<input id="salaryMax" type="number" min={0} step={1000} {...input('salaryMax')} aria-invalid={err('SalaryMax') ? true : undefined} />{err('SalaryMax') && <small>{err('SalaryMax')}</small>}</label>
            </div>
            <label>Stack (comma separated)<input id="technologies" {...input('technologies')} placeholder="C#, React, Azure" /></label>
            <div className="form-row">
              <label>Ad link<input id="adUrl" type="url" {...input('adUrl')} aria-invalid={err('AdUrl') ? true : undefined} />{err('AdUrl') && <small>{err('AdUrl')}</small>}</label>
              <label>Contact<input id="contact" {...input('contact')} /></label>
            </div>
            <label>Job description<textarea id="jobDescription" rows={4} {...input('jobDescription')} /></label>
            <label>Notes<textarea id="notes" rows={2} {...input('notes')} /></label>
            <footer>
              <button type="button" className="secondary" onClick={() => dialogRef.current?.close()}>Cancel</button>
              <button type="submit">Save</button>
            </footer>
          </form>
        </article>
      </dialog>
    </>
  );
}
