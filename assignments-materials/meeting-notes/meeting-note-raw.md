# Raw notes — Disbursement system kickoff (unedited)

> These are the raw notes/email an analyst received. Messy on purpose — it is the
> input for the Day-2 "requirement → spec" lab. Tidy it into proper FRs and spot
> what's missing or ambiguous.

---

**From:** Carol (Finance) <carol@example.co.th>
**To:** BA team
**Cc:** Bob (Ops Manager), Dave (IT)
**Subject:** RE: notes from this morning's เบิกจ่าย meeting — pls turn into a spec

Hi team — dumping what we talked about before I forget. We can refine later.

So the whole point is to stop doing reimbursement / เบิกจ่าย on paper + LINE. Right
now Alice's team fills a form, prints it, walks it to me, I sign, then it goes to
finance. Takes days and we lose the paper. We want it online.

Rough flow as I understand it:

- An employee (Alice's people are the main ones) makes a "request". It has a title,
  maybe a note, and a list of stuff they're claiming — like "monitor x2, 5,000
  each", "taxi 350". Each line has a qty and a price. System should total it up.
- They save it first as a draft, fiddle with the lines, then "submit" when ready.
- Once submitted it goes to their manager to approve. For Alice that's Bob.
- Bob can approve or reject (with a reason hopefully).
- BUT — and this is the important finance bit — if it's a big one, **I** (finance)
  also need to approve after the manager. Small stuff the manager can just clear on
  their own, otherwise everything lands on my desk and that's the whole problem
  today. We said the cutoff is **ten thousand baht**. Anything over that, finance
  has to sign off too. At or under, manager is enough. (we can change the number
  later, make it a setting?)
- After it's fully approved, finance marks it paid once the money actually goes out.
  Paid = done.
- People should be able to cancel something if they raised it by mistake, as long as
  it hasn't been approved yet.

Other things that came up:

- Bob complained he never knows when something is waiting for him — he only finds out
  if Alice pings him on LINE. Can the system just **let him know when something's been
  sent to him**? That's half the reason things sit for a week. (didn't decide exactly
  how — just "tell the approver".)
- Dave (IT/audit) was firm that we need a record of *who did what when* — every
  approve, reject, who, timestamp. For the year-end audit. Nothing should be quietly
  editable after the fact.
- Categories — travel, equipment, entertainment, misc — Carol wants to filter/report
  by these eventually. Not urgent.
- Currency: it's all baht. Someone (Dave?) asked "what about the overseas trips, USD?"
  and we kind of moved on. Park it. Default THB for now.
- Reporting: at month end I need to pull everything that's been approved and ready to
  pay into a spreadsheet for the payment run. Today I copy-paste. Would love a
  "download" button. CSV is fine.

Open questions I wrote in the margin (don't have answers):
- if Bob is the one who raised the request (he does buy team stuff sometimes), can he
  approve his own? feels wrong but nobody said.
- once it's paid and then turns out to be wrong... do we un-pay it? refund? no idea.
- the USD thing.

Roles, simplest version: requester (most people), manager (approves), finance (me —
approve big ones + mark paid), and an admin/IT super-user (Dave) who can do anything
if something's stuck.

Can you write this up properly? Don't over-engineer it, we want something the team
will actually use. Thanks!!

— Carol

P.S. login can be simple for the pilot, we're all internal. Don't spend time on
fancy SSO yet.