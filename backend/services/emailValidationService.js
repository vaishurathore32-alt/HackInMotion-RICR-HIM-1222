const ABSTRACT_API_URL = "https://emailreputation.abstractapi.com/v1/";

// Calls AbstractAPI's Email Validation & Verification API and reports
// whether the address is properly formatted AND actually exists /
// can receive mail (as opposed to just "looks like an email").
async function isEmailReal(email) {
  const apiKey = process.env.ABSTRACT_API_KEY;

  if (!apiKey) {
    throw new Error("ABSTRACT_API_KEY is not set in .env");
  }

  const url = `${ABSTRACT_API_URL}?api_key=${apiKey}&email=${encodeURIComponent(email)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`AbstractAPI request failed with status ${response.status}`);
  }

  const data = await response.json();
    console.log(`AbstractAPI result for ${email}:`, JSON.stringify(data));



  // Require all three: well-formed, AbstractAPI marks it deliverable,
  // and the mailbox itself responded as valid over SMTP.
   return deliverability !== "UNDELIVERABLE";
}

module.exports = { isEmailReal };
