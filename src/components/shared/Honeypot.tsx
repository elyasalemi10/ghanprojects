// Spam honeypot. Hidden off-screen (not display:none, so naive bots that fill
// every rendered input still take the bait) and removed from the tab order +
// a11y tree so real users never touch it. The API routes reject any submission
// where `companyWebsite` is non-empty. Pair with `new FormData(form)` /
// formData.get("companyWebsite") on submit so the value reaches the server.
export function Honeypot() {
  return (
    <input
      type="text"
      name="companyWebsite"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      style={{ position: "absolute", left: "-9999px", top: "auto", width: 1, height: 1, opacity: 0 }}
    />
  );
}
