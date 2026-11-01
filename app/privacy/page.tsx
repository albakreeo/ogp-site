import type { Metadata } from "next";
import "./privacy.css";

export const metadata: Metadata = {
  title: "Privacy Policy | سياسة الخصوصية — OGP",
  description:
    "How Online Growth Partner (OGP) collects and uses personal data submitted through its website. سياسة الخصوصية لموقع أونلاين جروث بارتنر.",
  alternates: { canonical: "/privacy" },
};

const EMAIL = "info@ogpdigital.com";
const UPDATED_EN = "1 November 2026";
const UPDATED_AR = "1 نوفمبر 2026";

export default function PrivacyPage() {
  return (
    <div className="pv">
      <header className="pv-top">
        <div className="pv-bar">
          <a className="home" href="/">OGP</a>
          <nav className="pv-langs" aria-label="Language">
            <a href="#ar">العربية</a>
            <a href="#en">English</a>
          </nav>
        </div>
      </header>
      <main className="pv-main">
        <article id="ar" className="pv-doc" dir="rtl" lang="ar">
          <h1>سياسة الخصوصية</h1>
          <p className="upd">آخر تحديث: {UPDATED_AR}</p>

          <h2>من نحن</h2>
          <p>
            شركة أونلاين جروث بارتنر أو جي بي (OGP)، الرياض، المملكة العربية السعودية، الرقم الوطني الموحد 7034236914.
            نحن الجهة المسؤولة عن البيانات الشخصية التي تُرسل عبر هذا الموقع.
          </p>

          <h2>البيانات التي نجمعها</h2>
          <ul>
            <li>ما تدخله في نموذج الطلب: الاسم، رقم الجوال أو واتساب، رابط موقعك أو متجرك، ونوع الخدمة التي تحتاجها.</li>
            <li>
              بيانات تقنية وتسويقية عند إرسال الطلب: المصدر الذي وصلت منه (مثل علامات UTM ومعرّفات النقرات الإعلانية)،
              الصفحة التي دخلت منها، الموقع المُحيل، لغة الصفحة، عنوان IP، ونوع المتصفح.
            </li>
            <li>وقت موافقتك على هذه السياسة.</li>
          </ul>
          <p>
            لا ينشئ هذا الموقع ملفات تعريف ارتباط (cookies) إعلانية. تُحفظ علامات المصدر مؤقتاً في ذاكرة المتصفح خلال
            زيارتك فقط وتُحذف عند إغلاق المتصفح.
          </p>

          <h2>لماذا نستخدمها</h2>
          <ul>
            <li>الرد على طلبك والتواصل معك عبر الاتصال أو واتساب أو البريد الإلكتروني.</li>
            <li>تقييم فعالية حملاتنا التسويقية ومعرفة القنوات التي تصل منها الطلبات.</li>
            <li>حماية الموقع من الرسائل المزعجة وإساءة الاستخدام.</li>
          </ul>

          <h2>مع من نشاركها</h2>
          <p>
            لا نبيع بياناتك. نستعين بمزودي خدمات لتشغيل الموقع: الاستضافة (Vercel)، قاعدة البيانات (Neon)، إرسال البريد
            (Resend)، وخطوط Google Fonts. قد تُعالج بياناتك على خوادم خارج المملكة العربية السعودية لدى هؤلاء المزودين.
            إذا راسلتنا عبر واتساب فإن المحادثة تخضع لسياسة واتساب.
          </p>

          <h2>مدة الاحتفاظ</h2>
          <p>نحتفظ بالطلبات للمدة اللازمة للرد عليك ومتابعة طلبك والأغراض المذكورة أعلاه، ثم نحذفها.</p>

          <h2>حقوقك</h2>
          <p>
            يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها، وسحب موافقتك في أي وقت، وذلك وفق نظام حماية البيانات
            الشخصية في المملكة العربية السعودية. راسلنا على <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>

          <h2>التواصل</h2>
          <p>
            لأي استفسار عن هذه السياسة: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. سننشر أي تعديل على هذه الصفحة مع تحديث
            تاريخها.
          </p>
        </article>

        <article id="en" className="pv-doc" dir="ltr" lang="en">
          <h1>Privacy Policy</h1>
          <p className="upd">Last updated: {UPDATED_EN}</p>

          <h2>Who we are</h2>
          <p>
            Online Growth Partner Co. (OGP), Riyadh, Saudi Arabia, Unified National Number 7034236914. We are the
            controller of the personal data submitted through this website.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>What you enter in the request form: your name, phone or WhatsApp number, website or store link, and the service you need.</li>
            <li>
              Technical and marketing details when you send the form: where you came from (for example UTM labels and ad
              click identifiers), the page you landed on, the referring site, the page language, your IP address and your
              browser type.
            </li>
            <li>The time you agreed to this policy.</li>
          </ul>
          <p>
            This site does not set advertising cookies. Source labels are kept temporarily in your browser during your
            visit only and are cleared when you close the browser.
          </p>

          <h2>Why we use it</h2>
          <ul>
            <li>To answer your request and contact you by phone, WhatsApp or email.</li>
            <li>To measure how well our marketing works and which channels bring requests.</li>
            <li>To protect the site from spam and abuse.</li>
          </ul>

          <h2>Who we share it with</h2>
          <p>
            We do not sell your data. We use service providers to run the site: hosting (Vercel), database (Neon), email
            delivery (Resend) and Google Fonts. These providers may process your data on servers outside Saudi Arabia. If
            you message us on WhatsApp, that conversation is subject to WhatsApp&rsquo;s own policy.
          </p>

          <h2>How long we keep it</h2>
          <p>We keep requests for as long as needed to answer you, follow up on your request and for the purposes above, then delete them.</p>

          <h2>Your rights</h2>
          <p>
            You may ask to access, correct or delete your data, and withdraw your consent at any time, in line with the
            Saudi Personal Data Protection Law. Write to <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. We will post any change on this page and
            update its date.
          </p>
        </article>
      </main>
    </div>
  );
}
