import { useState, useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { Plus, Settings, MoreHorizontal } from 'lucide-react';
import {
  TodoListsClient, TodoItemsClient, SwaggerException,
  CreateTodoListCommand, UpdateTodoListCommand,
  CreateTodoItemCommand, UpdateTodoItemCommand, UpdateTodoItemDetailCommand,
  type TodoListDto, type TodoItemDto,
} from '../web-api-client';

const listsClient = new TodoListsClient();
const itemsClient = new TodoItemsClient();

// The generated API types mark every field optional. These are the shapes this
// page actually works with; the API data is checked and filled in once, below.
interface Item { id: number; listId: number; title: string; done: boolean; priority: number; note: string; }
interface List { id: number; title: string; colour: string; items: Item[]; }
interface Lookup { id: number; title: string; }
interface Colour { name: string; code: string; }
interface ListOptions { title: string; colour: string; }
interface ItemDetails { listId: number; priority: number; note: string; }

const toItem = (dto: TodoItemDto): Item => ({
  id: dto.id ?? 0,
  listId: dto.listId ?? 0,
  title: dto.title ?? '',
  done: dto.done ?? false,
  priority: dto.priority ?? 0,
  note: dto.note ?? '',
});

const toList = (dto: TodoListDto): List => ({
  id: dto.id ?? 0,
  title: dto.title ?? '',
  colour: dto.colour ?? '',
  items: (dto.items ?? []).map(toItem),
});

// Pico CSS reads these custom properties; React's style type doesn't know them.
const dangerButtonStyle = {
  '--pico-background-color': 'var(--pico-del-color)',
  '--pico-border-color': 'var(--pico-del-color)',
  '--pico-color': '#fff',
} as CSSProperties;

const noListOptions: ListOptions = { title: '', colour: '' };
const noItemDetails: ItemDetails = { listId: 0, priority: 0, note: '' };

export function Tasks() {
  const [lists, setLists] = useState<List[] | null>(null);
  const [priorityLevels, setPriorityLevels] = useState<Lookup[]>([]);
  const [colours, setColours] = useState<Colour[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [listOptionsEditor, setListOptionsEditor] = useState<ListOptions>(noListOptions);
  const [itemDetailsEditor, setItemDetailsEditor] = useState<ItemDetails>(noItemDetails);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListColour, setNewListColour] = useState('');
  const [newListError, setNewListError] = useState('');

  const originalTitle = useRef('');
  const editCancelledRef = useRef(false);
  const newItemCancelledRef = useRef(false);

  const newListDialogRef = useRef<HTMLDialogElement>(null);
  const listOptionsDialogRef = useRef<HTMLDialogElement>(null);
  const deleteListDialogRef = useRef<HTMLDialogElement>(null);
  const itemDetailsDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    listsClient.getTodoLists().then(result => {
      const apiLists = (result.lists ?? []).map(toList);
      setLists(apiLists);
      setPriorityLevels((result.priorityLevels ?? []).map(p => ({ id: p.id ?? 0, title: p.title ?? '' })));
      const apiColours = (result.colours ?? []).map(c => ({ name: c.name ?? '', code: c.code ?? '' }));
      setColours(apiColours);
      setNewListColour(apiColours[0]?.code ?? '');
      if (apiLists.length) setSelectedListId(apiLists[0].id);
    }).catch(console.error);
  }, []);

  // Switching lists clears the half-typed new item.
  const selectList = (id: number | null) => {
    setSelectedListId(id);
    setNewItemTitle('');
    setAddingItem(false);
  };

  const selectedList = lists?.find(l => l.id === selectedListId) ?? null;
  const remainingItems = (list: List) => list.items.filter(t => !t.done).length;
  const firstColour = () => colours[0]?.code ?? '';

  // ── Lists ──────────────────────────────────────────────────────────────────

  const showNewListDialog = () => {
    setNewListTitle('');
    setNewListColour(firstColour());
    setNewListError('');
    newListDialogRef.current?.showModal();
    setTimeout(() => document.getElementById('newListTitle')?.focus(), 50);
  };

  const closeNewListDialog = () => {
    newListDialogRef.current?.close();
    setNewListTitle('');
    setNewListColour(firstColour());
    setNewListError('');
  };

  const commitNewList = async () => {
    const title = newListTitle.trim();
    if (!title) return;
    try {
      const id = await listsClient.createTodoList(new CreateTodoListCommand({ title, colour: newListColour }));
      const newList: List = { id, title, colour: newListColour, items: [] };
      setLists(ls => [...(ls ?? []), newList]);
      selectList(id);
      closeNewListDialog();
    } catch (e) {
      if (e instanceof SwaggerException) {
        try {
          const errors: Record<string, string[]> | undefined = JSON.parse(e.response).errors;
          if (errors?.Title) { setNewListError(errors.Title[0]); return; }
        } catch { /* not a validation error */ }
      }
      setNewListError('Failed to create list.');
    }
  };

  const showListOptionsDialog = () => {
    if (!selectedList) return;
    setListOptionsEditor({ title: selectedList.title, colour: selectedList.colour || firstColour() });
    listOptionsDialogRef.current?.showModal();
  };

  const closeListOptionsDialog = () => {
    listOptionsDialogRef.current?.close();
    setListOptionsEditor(noListOptions);
  };

  const updateListOptions = async () => {
    if (!selectedList) return;
    const { id } = selectedList;
    const { title, colour } = listOptionsEditor;
    try {
      await listsClient.updateTodoList(id, new UpdateTodoListCommand({ id, title, colour }));
      setLists(ls => (ls ?? []).map(l => l.id === id ? { ...l, title, colour } : l));
      closeListOptionsDialog();
    } catch (e) { console.error(e); }
  };

  const confirmDeleteList = () => {
    closeListOptionsDialog();
    deleteListDialogRef.current?.showModal();
  };

  const closeDeleteListDialog = () => deleteListDialogRef.current?.close();

  const deleteListConfirmed = async () => {
    if (!selectedList || !lists) return;
    try {
      await listsClient.deleteTodoList(selectedList.id);
      const remaining = lists.filter(l => l.id !== selectedList.id);
      setLists(remaining);
      selectList(remaining.length ? remaining[0].id : null);
      closeDeleteListDialog();
    } catch (e) { console.error(e); }
  };

  // ── Items ──────────────────────────────────────────────────────────────────

  const showItemDetailsDialog = (item: Item) => {
    setSelectedItem(item);
    setItemDetailsEditor({ listId: item.listId, priority: item.priority, note: item.note });
    itemDetailsDialogRef.current?.showModal();
  };

  const closeItemDetailsDialog = () => {
    itemDetailsDialogRef.current?.close();
    setSelectedItem(null);
    setItemDetailsEditor(noItemDetails);
  };

  const updateItemDetails = async () => {
    if (!selectedItem) return;
    const isMoving = selectedItem.listId !== itemDetailsEditor.listId;
    try {
      await itemsClient.updateTodoItemDetail(selectedItem.id,
        new UpdateTodoItemDetailCommand({ id: selectedItem.id, ...itemDetailsEditor }));
      setLists(ls => (ls ?? []).map(l => {
        if (l.id === selectedItem.listId && isMoving)
          return { ...l, items: l.items.filter(i => i.id !== selectedItem.id) };
        if (l.id === itemDetailsEditor.listId && isMoving)
          return { ...l, items: [...l.items, { ...selectedItem, ...itemDetailsEditor }] };
        if (l.id === selectedItem.listId)
          return { ...l, items: l.items.map(i => i.id === selectedItem.id ? { ...i, priority: itemDetailsEditor.priority, note: itemDetailsEditor.note } : i) };
        return l;
      }));
      closeItemDetailsDialog();
    } catch (e) { console.error(e); }
  };

  const deleteItem = async (item: Item) => {
    if (itemDetailsDialogRef.current?.open) closeItemDetailsDialog();
    try {
      await itemsClient.deleteTodoItem(item.id);
      setLists(ls => (ls ?? []).map(l => l.id === selectedListId
        ? { ...l, items: l.items.filter(i => i.id !== item.id) } : l));
    } catch (e) { console.error(e); }
  };

  const saveItem = (item: Item) =>
    itemsClient.updateTodoItem(item.id, new UpdateTodoItemCommand({ id: item.id, title: item.title, done: item.done }));

  const updateCheckbox = async (item: Item, done: boolean) => {
    const updated = { ...item, done };
    setLists(ls => (ls ?? []).map(l => l.id === selectedListId
      ? { ...l, items: l.items.map(i => i.id === item.id ? updated : i) } : l));
    try { await saveItem(updated); }
    catch (e) { console.error(e); }
  };

  const editItem = (item: Item, inputId: string) => {
    originalTitle.current = item.title;
    setEditValue(item.title);
    setEditingItem(item);
    setTimeout(() => document.getElementById(inputId)?.focus(), 100);
  };

  const cancelEdit = (e: KeyboardEvent<HTMLInputElement>) => {
    editCancelledRef.current = true;
    setLists(ls => (ls ?? []).map(l => ({
      ...l, items: l.items.map(i => i === editingItem ? { ...i, title: originalTitle.current } : i)
    })));
    setEditingItem(null);
    e.currentTarget.blur();
  };

  const commitEdit = async () => {
    if (!editingItem) return;
    if (!editValue.trim()) {
      await deleteItem(editingItem);
      setEditingItem(null);
      return;
    }
    const updated = { ...editingItem, title: editValue.trim() };
    setLists(ls => (ls ?? []).map(l => l.id === selectedListId
      ? { ...l, items: l.items.map(i => i === editingItem ? updated : i) } : l));
    setEditingItem(null);
    try { await saveItem(updated); }
    catch (e) { console.error(e); }
  };

  const startAddingItem = () => {
    setAddingItem(true);
    setTimeout(() => document.getElementById('newItemInput')?.focus(), 50);
  };

  const cancelNewItem = (e: KeyboardEvent<HTMLInputElement>) => {
    newItemCancelledRef.current = true;
    setAddingItem(false);
    setNewItemTitle('');
    e.currentTarget.blur();
  };

  const commitNewItem = async () => {
    setAddingItem(false);
    if (!newItemTitle.trim()) { setNewItemTitle(''); return; }
    const title = newItemTitle.trim();
    const listId = selectedListId;
    setNewItemTitle('');
    if (listId === null) return;
    try {
      const id = await itemsClient.createTodoItem(new CreateTodoItemCommand({ title, listId }));
      const item: Item = { id, listId, title, done: false, priority: priorityLevels[0]?.id ?? 0, note: '' };
      setLists(ls => (ls ?? []).map(l => l.id === listId ? { ...l, items: [...l.items, item] } : l));
    } catch (e) { console.error(e); }
  };

  if (!lists) return <span aria-busy="true">Loading&hellip;</span>;

  return (
    <>
      <hgroup>
        <h1>Tasks</h1>
        <p>Manage your todo lists and tasks.</p>
      </hgroup>

      <div className="todo-layout">

        {/* Sidebar */}
        <div className="todo-sidebar">
          <div className="todo-panel-header">
            <h2>Lists</h2>
            <button className="icon-btn" onClick={showNewListDialog}><Plus size={20} strokeWidth={2} /></button>
          </div>
          <ul>
            {lists.map(list => (
              <li key={list.id}
                aria-current={selectedList === list ? 'true' : undefined}
                onClick={() => selectList(list.id)}>
                <span className="colour-dot" style={{ background: list.colour }} aria-hidden="true"></span>
                <span>{list.title}</span>
                <small>{remainingItems(list)}</small>
              </li>
            ))}
          </ul>
        </div>

        {/* Items panel */}
        {selectedList && (
          <div className="todo-main">
            <div className="todo-panel-header">
              <h2 style={{ color: selectedList.colour }}>{selectedList.title}</h2>
              <button className="icon-btn" onClick={showListOptionsDialog}><Settings size={20} strokeWidth={2} /></button>
            </div>

            {selectedList.items.map((item, i) => (
              <div key={item.id} className="todo-item">
                <input type="checkbox" checked={item.done}
                  onChange={e => updateCheckbox(item, e.target.checked)} />
                {editingItem === item ? (
                  <input id={`itemTitle${i}`} type="text" className="todo-item-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.currentTarget.blur(); }
                      if (e.key === 'Escape') cancelEdit(e);
                    }}
                    onBlur={() => {
                      if (editCancelledRef.current) { editCancelledRef.current = false; return; }
                      commitEdit();
                    }}
                    autoFocus maxLength={200} />
                ) : (
                  <span className={`todo-item-text${item.done ? ' todo-done' : ''}`}
                    onClick={() => editItem(item, `itemTitle${i}`)}>
                    {item.title}
                  </span>
                )}
                {item.id !== 0 && (
                  <button className="icon-btn" onClick={() => showItemDetailsDialog(item)}><MoreHorizontal size={20} strokeWidth={2} /></button>
                )}
              </div>
            ))}

            <div className="todo-item todo-new-item">
              <input type="checkbox" disabled />
              {addingItem ? (
                <input id="newItemInput" type="text" className="todo-item-input"
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitNewItem();
                    if (e.key === 'Escape') cancelNewItem(e);
                  }}
                  onBlur={() => {
                    if (newItemCancelledRef.current) { newItemCancelledRef.current = false; return; }
                    commitNewItem();
                  }}
                  maxLength={200} />
              ) : (
                <span className="todo-item-text todo-new-item-placeholder"
                  onClick={startAddingItem}>New task…</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New List dialog */}
      <dialog ref={newListDialogRef}>
        <article>
          <header>
            <h3>New List</h3>
            <button rel="prev" aria-label="Close" onClick={closeNewListDialog}></button>
          </header>
          <label htmlFor="newListTitle">Title</label>
          <input type="text" id="newListTitle" placeholder="List title…"
            value={newListTitle} onChange={e => setNewListTitle(e.target.value)}
            aria-invalid={newListError ? 'true' : undefined}
            onKeyDown={e => e.key === 'Enter' && commitNewList()}
            maxLength={200} />
          {newListError && <small>{newListError}</small>}
          <label>Colour</label>
          <div className="colour-picker">
            {colours.map(c => (
              <button key={c.code} type="button" className={`colour-swatch${newListColour === c.code ? ' selected' : ''}`}
                style={{ background: c.code }} aria-label={c.name}
                onClick={() => setNewListColour(c.code)} />
            ))}
          </div>
          <footer>
            <button className="secondary" onClick={closeNewListDialog}>Cancel</button>
            <button onClick={commitNewList}>Create</button>
          </footer>
        </article>
      </dialog>

      {/* List Options dialog */}
      <dialog ref={listOptionsDialogRef}>
        <article>
          <header>
            <h3>List Options</h3>
            <button rel="prev" aria-label="Close" onClick={closeListOptionsDialog}></button>
          </header>
          <label htmlFor="listOptionsTitle">Title</label>
          <input type="text" id="listOptionsTitle" placeholder="List name…"
            value={listOptionsEditor.title}
            onChange={e => setListOptionsEditor(ed => ({ ...ed, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && updateListOptions()}
            maxLength={200} />
          <label>Colour</label>
          <div className="colour-picker">
            {colours.map(c => (
              <button key={c.code} type="button" className={`colour-swatch${listOptionsEditor.colour === c.code ? ' selected' : ''}`}
                style={{ background: c.code }} aria-label={c.name}
                onClick={() => setListOptionsEditor(ed => ({ ...ed, colour: c.code }))} />
            ))}
          </div>
          <footer>
            <button className="danger" style={{ marginInlineEnd: 'auto' }} onClick={confirmDeleteList}>Delete</button>
            <button className="secondary" onClick={closeListOptionsDialog}>Cancel</button>
            <button onClick={updateListOptions}>Update</button>
          </footer>
        </article>
      </dialog>

      {/* Delete List dialog */}
      <dialog ref={deleteListDialogRef}>
        <article>
          <header>
            <h3>Delete "{selectedList?.title}"?</h3>
            <button rel="prev" aria-label="Close" onClick={closeDeleteListDialog}></button>
          </header>
          <p>All items will be permanently deleted.</p>
          <footer>
            <button className="secondary" onClick={closeDeleteListDialog}>Cancel</button>
            <button className="danger"
              style={dangerButtonStyle}
              onClick={deleteListConfirmed}>Delete</button>
          </footer>
        </article>
      </dialog>

      {/* Item Details dialog */}
      <dialog ref={itemDetailsDialogRef}>
        <article>
          <header>
            <h3>Item Details</h3>
            <button rel="prev" aria-label="Close" onClick={closeItemDetailsDialog}></button>
          </header>
          <label htmlFor="itemList">List</label>
          <select id="itemList" value={itemDetailsEditor.listId || ''}
            onChange={e => setItemDetailsEditor(ed => ({ ...ed, listId: +e.target.value }))}>
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.title}</option>
            ))}
          </select>
          <label htmlFor="itemPriority">Priority</label>
          <select id="itemPriority" value={itemDetailsEditor.priority || ''}
            onChange={e => setItemDetailsEditor(ed => ({ ...ed, priority: +e.target.value }))}>
            {priorityLevels.map(level => (
              <option key={level.id} value={level.id}>{level.title}</option>
            ))}
          </select>
          <label htmlFor="itemNote">Note</label>
          <textarea id="itemNote" rows={3} value={itemDetailsEditor.note}
            onChange={e => setItemDetailsEditor(ed => ({ ...ed, note: e.target.value }))}></textarea>
          <footer>
            <button className="danger" style={{ marginInlineEnd: 'auto' }} onClick={() => selectedItem && deleteItem(selectedItem)}>Delete</button>
            <button className="secondary" onClick={closeItemDetailsDialog}>Cancel</button>
            <button onClick={updateItemDetails}>Update</button>
          </footer>
        </article>
      </dialog>
    </>
  );
}
