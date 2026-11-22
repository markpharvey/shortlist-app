using Shortlist.Web.Infrastructure;

namespace Shortlist.Application.FunctionalTests.Registration;

public class RegistrationGateTests
{
    private static readonly string[] NoList = [];
    private static readonly string[] OwnerOnly = ["owner@example.com"];

    [Test]
    public void TheFirstPersonMayRegister() =>
        RegistrationGate.MayRegister("anyone@example.com", NoList, anyUsersExist: false).ShouldBeTrue();

    [Test]
    public void NobodyElseMayRegisterOnceSomeoneHas() =>
        RegistrationGate.MayRegister("stranger@example.com", NoList, anyUsersExist: true).ShouldBeFalse();

    [Test]
    public void AnEmailOnTheListMayRegisterInAnyCase() =>
        RegistrationGate.MayRegister("Owner@Example.com", OwnerOnly, anyUsersExist: true).ShouldBeTrue();

    [Test]
    public void AnEmailOffTheListMayNotRegisterEvenIfNobodyHas() =>
        RegistrationGate.MayRegister("stranger@example.com", OwnerOnly, anyUsersExist: false).ShouldBeFalse();

    [Test]
    public void AMissingEmailMayNotRegisterWhenThereIsAList() =>
        RegistrationGate.MayRegister(null, OwnerOnly, anyUsersExist: false).ShouldBeFalse();
}
