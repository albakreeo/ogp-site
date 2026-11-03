import fs from "node:fs";
import path from "node:path";
import { headers } from "next/headers";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { CONTENT_FIELDS, readDefaults } from "@/lib/content";
import { SEO_DEFAULTS, seoValues } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { saveContentAction, saveSeoAction } from "./actions";
import { Field } from "./counter";

export const dynamic = "force-dynamic";

const html = fs.readFileSync(path.join(process.cwd(), "app", "body.html"), "utf8");

export default async function SeoPage() {
  if (!isAdminAuthorized((await headers()).get("authorization"))) {
    return <p className="muted">Authentication required.</p>;
  }
  if (!isDbConfigured) {
    return (
      <div className="card narrow">
        <h1>Not connected to a database</h1>
        <p className="muted">Add a Neon Postgres database to the Vercel project, then redeploy.</p>
      </div>
    );
  }

  const settings = await getSettings();
  const seo = seoValues(settings);
  const defaults = readDefaults(html);
  const groups = [...new Set(CONTENT_FIELDS.map((f) => f.group))];

  return (
    <div className="stack">
      <div>
        <h1>SEO &amp; content</h1>
        <p className="muted">
          Leave a field empty to keep the default text. Changes appear on the site within a few seconds after saving.
        </p>
      </div>

      <form action={saveSeoAction} className="card form">
        <h2>Search engines and sharing</h2>
        <p className="muted small">
          The site is one page in two languages. Search engines read one set of tags, so pick the main language. The
          other language is used only if the main one is empty. Keywords from both languages are merged.
        </p>

        <label className="fld">
          <span className="fld-top"><span>Main language for search engines</span></span>
          <select name="primary" defaultValue={seo.primary}>
            <option value="ar">Arabic</option>
            <option value="en">English</option>
          </select>
        </label>

        <div className="two">
          <Field name="title_ar" label="Title (Arabic)" defaultValue={seo.title.ar} placeholder={SEO_DEFAULTS.title} hint={60} max={120} rtl />
          <Field name="title_en" label="Title (English)" defaultValue={seo.title.en} placeholder={SEO_DEFAULTS.title} hint={60} max={120} />
        </div>
        <div className="two">
          <Field name="description_ar" label="Description (Arabic)" defaultValue={seo.description.ar} placeholder={SEO_DEFAULTS.description} rows={3} hint={160} max={320} rtl />
          <Field name="description_en" label="Description (English)" defaultValue={seo.description.en} placeholder={SEO_DEFAULTS.description} rows={3} hint={160} max={320} />
        </div>
        <div className="two">
          <Field name="keywords_ar" label="Keywords (Arabic, comma separated)" defaultValue={seo.keywords.ar} placeholder="تسويق بالأداء، إعلانات قوقل، الرياض" rows={2} max={500} rtl />
          <Field name="keywords_en" label="Keywords (English, comma separated)" defaultValue={seo.keywords.en} placeholder="performance marketing, google ads, riyadh" rows={2} max={500} />
        </div>
        <Field name="og_image" label="Share image URL (https://…, about 1200×630)" defaultValue={seo.ogImage} placeholder="https://www.ogpdigital.com/og.jpg" rows={1} max={500} />

        <div className="row"><button type="submit">Save SEO</button></div>
      </form>

      <form action={saveContentAction} className="card form">
        <h2>Headings and page text</h2>
        <p className="muted small">The grey text is what the site shows now. Type to replace it in that language.</p>
        {groups.map((g) => (
          <fieldset key={g}>
            <legend>{g}</legend>
            {CONTENT_FIELDS.filter((f) => f.group === g).map((f) => (
              <div key={f.key} className="two">
                <Field
                  name={`${f.key}_en`}
                  label={`${f.label} (English)`}
                  defaultValue={settings[`content.${f.key}.en`] ?? ""}
                  placeholder={defaults[f.key]?.en}
                  rows={f.long ? 2 : 1}
                  max={f.long ? 300 : 140}
                />
                <Field
                  name={`${f.key}_ar`}
                  label={`${f.label} (Arabic)`}
                  defaultValue={settings[`content.${f.key}.ar`] ?? ""}
                  placeholder={defaults[f.key]?.ar}
                  rows={f.long ? 2 : 1}
                  max={f.long ? 300 : 140}
                  rtl
                />
              </div>
            ))}
          </fieldset>
        ))}
        <div className="row"><button type="submit">Save texts</button></div>
      </form>
    </div>
  );
}
