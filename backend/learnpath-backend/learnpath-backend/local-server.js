// Local development entrypoint only. Vercel does NOT use this file - it
// invokes api/index.js directly as a serverless function. This just wraps
// the same Express app in a plain http.listen() so you can run:
//
//   npm run dev
//
// and hit http://localhost:3000/api/... while building/testing locally.

require("dotenv").config();
const app = require("./api/index.js");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Learnpath backend listening on http://localhost:${PORT}`);
});
