/**
 * Self-check for blow-dry bundle visits against the REAL ORÁ database, using a
 * throwaway bundle (email ora-bundle-selfcheck@example.com), voided at the end. Delete it
 * afterwards in Supabase: delete from ora_bundles where email = 'ora-bundle-selfcheck@example.com'. Also checks the bundle payment rule
 * with a faked Stripe. Run: npx tsx script/check-bundles.ts
 */
import assert from "node:assert/strict";
process.loadEnvFile(".env");
const B = await import("../api/_lib/bundles.ts");

const email = "ora-bundle-selfcheck@example.com", appt = `SELFCHECK${Date.now()}`;
const inAWeek = new Date(Date.now() + 7 * 864e5).toISOString(), inAYear = new Date(Date.now() + 365 * 864e5).toISOString();
const made = await B.createBundle({ client_name: "Self Check", email, phone: "+447000000001", size: 4, price: 120, source: "online", paid: true, expiry_months: 6 });
assert.ok(made.ok, String((made as any).error));
const id = made.data.id;
try {
  assert.equal((await B.activeBundleFor(email, inAWeek))?.id, id, "found for a visit next week");
  assert.equal(await B.activeBundleFor(email, inAYear), null, "not for a visit after it runs out");
  const used = await B.bundleAction(id, "use", { appointment_id: appt, visit_at: inAWeek, service: "Straight Blow Dry" });
  assert.ok(used.ok && used.data.used === 1 && Date.parse(used.data.uses[0].visit_at!) === Date.parse(inAWeek), "counted with its visit time");
  const again = await B.bundleAction(id, "use", { appointment_id: appt, visit_at: inAWeek });
  assert.ok(again.ok && again.data.used === 1, "same appointment twice = still 1");
  assert.equal((await B.bundleOfAppointment(appt))?.id, id, "found by appointment");
  const later = new Date(Date.now() + 9 * 864e5).toISOString();
  const moved = await B.bundleAppt(appt, "move", later);
  assert.ok(moved.ok && Date.parse(moved.data!.uses[0].visit_at!) === Date.parse(later), "rescheduled visit moves");
  const back = await B.bundleAppt(appt, "release");
  assert.ok(back.ok && back.data!.used === 0, "cancel / no-show gives it back");
  const none = await B.bundleAppt(appt, "release");
  assert.ok(none.ok && none.data === null, "releasing twice is harmless");
  const late = await B.bundleAction(id, "use", { appointment_id: appt, visit_at: inAYear });
  assert.ok(!late.ok && /runs out/.test(late.error), "can't book a visit after it runs out");
  console.log("✓ bundle visits: count, idempotent, move, release, expiry");
} finally {
  await B.bundleAction(id, "void");
  console.log(`test bundle ${id} voided`);
}

/* bundle payment rule, with Stripe faked */
process.env.STRIPE_SECRET_KEY = "sk_test_selfcheck";
const svc = "hair/straight-blow-dry-short";
let intent: any = { id: "pi_x", status: "requires_capture", amount: 12000, metadata: { kind: "bundle", serviceId: svc, bundle: "4" } };
globalThis.fetch = (async () => new Response(JSON.stringify(intent), { status: 200 })) as any;
const { verifyDeposit } = await import("../api/_lib/deposit-guard.ts");
const v = (b: number, pid?: string) => verifyDeposit({ serviceId: svc, paymentIntentId: pid, bundle: b });
assert.equal((await v(4, "pi_x")).ok, true, "£120 for a 4-bundle passes");
assert.equal((await v(4)).ok, true, "no payment → allowed, paid at the desk (the app, until it takes cards)");
assert.equal((await v(6, "pi_x")).ok, false, "4-bundle payment can't buy a 6-bundle");
intent = { ...intent, amount: 2400 };
assert.equal((await v(4, "pi_x")).ok, false, "wrong amount → refused");
intent = { ...intent, amount: 12000, metadata: { serviceId: svc } };
assert.equal((await v(4, "pi_x")).ok, false, "a deposit payment can't buy a bundle");
console.log("✓ bundle payment: full price, right size, must be a bundle payment");
