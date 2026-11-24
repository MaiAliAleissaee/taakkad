import { evaluateUrls } from "../src/lib/services/url/evaluation";
import { developmentUrls, heldOutUrls } from "../src/test/fixtures/url-evaluation";

console.log(JSON.stringify({
  methodology: "Fixed synthetic development/held-out split. Positive = deterministic URL classification suspicious (score >= 50). No URL fetch, AI or RDAP in this evaluation. Not real-world performance.",
  development: evaluateUrls(developmentUrls),
  heldOut: evaluateUrls(heldOutUrls),
}, null, 2));