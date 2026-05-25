## What broke

Looking at the last security migration, I found a **typo bug** in the new storage upload policy that breaks every photo/video upload — for everyone, on every device. That alone explains "uploading shows wrong" right after Google sign-in.

### The bug (storage policy)

The policy for uploading to `event-media` says:

```sql
WHERE p.event_token = (storage.foldername(p.name))[2]
```

`p.name` is the **participant's display name** (e.g. "Ez Odeh"), not the file path. It should be the storage object's name. So the EXISTS check never matches → every upload is rejected by RLS → the camera shows an error.

### The "row violates users" sign-in error

There is no `users` table in this project, so the message is from RLS on a table the sign-in flow writes to — most likely `participants` (auto-registration in `EventWelcome` when you're logged in). The current INSERT policy only allows joining events where `is_hidden = false`. If the event you tested on your phone is hidden / unpublished, the insert fails with an RLS error. I want to confirm this before changing the policy, since loosening it has security implications.

## Plan (minimal, surgical)

1. **Fix the storage upload policy bug.** New migration that drops and recreates the `event-media` INSERT policy so it correctly references `storage.objects.name` instead of `participants.name`. Owners can still upload covers; verified participants of active, visible events can upload under `events/<token>/...`. No other policies changed.

2. **Confirm the second issue before touching it.** I'll ask you one question (below) so I don't guess and create another bug.

No frontend code changes. No new features. No other policy changes.

## One question I need answered

When you say "sign in from my phone, row violates users":
- Is it on the **/auth** screen (email + password or Google) **before** you open any event link?
- Or is it **after** scanning a QR / opening an event link, on the welcome screen?

If you can also screenshot the exact red error text it would let me pinpoint it in one shot instead of guessing.