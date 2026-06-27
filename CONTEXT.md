# Guardiola Foundry

Core business concepts for the system, captured here so the language stays stable as features are added.

## Language

**User**:
A person who can sign in to the system with credentials. A User may gain one or more roles later, but role assignment is not part of the term itself.
_Avoid_: Account, Member, Actor

**Admin**:
A User role that can create and manage other Users. Admin is an authorization role, not a separate identity type.
_Avoid_: Superuser, Owner

**Operator**:
A User role for authenticated system use without user-management authority. Operator is an authorization role, not a separate identity type.
_Avoid_: Staff, Agent

**Email Address**:
The User identifier used for sign-in. Email Address matching is case-insensitive, and the stored value is normalized for uniqueness and lookup.
_Avoid_: Username, Login

**Active User**:
A User who is allowed to authenticate and use the system. Inactive Users remain as records but cannot sign in.
_Avoid_: Enabled Account, Deleted User

**Password Change**:
An authenticated action where a User replaces their password by presenting their current password and a new password.
_Avoid_: Password Reset, Recovery

**Password Recovery**:
A separate flow for a User who cannot authenticate because they no longer know their password. Password Recovery is distinct from an authenticated Password Change.
_Avoid_: Password Change, Login Help
