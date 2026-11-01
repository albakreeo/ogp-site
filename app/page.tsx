import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

const html = fs.readFileSync(path.join(process.cwd(), "app", "body.html"), "utf8");

export default function Page() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Script src="/site.js" strategy="afterInteractive" />
    </>
  );
}
