import React from 'react'
import { NextSeo } from 'next-seo'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'

const Datenschutzerklaerung = () => {
  return (
    <>
      <NextSeo
        title="Datenschutzerklärung"
        description="Datenschutzerklärung und Informationen zum Datenschutz"
        noindex={true}
      />

      <div className="bg-[#1C1D20] min-h-screen">
        <div className="bg-white min-h-screen flex flex-col justify-between relative z-10 shadow-2xl mb-0 md:mb-[500px]">
         <Navigation theme="light" />

         <main className="flex-grow pt-32 pb-20 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full overflow-hidden">
           <div className="max-w-[800px] mx-auto relative z-10">
             <div className="prose prose-lg max-w-none prose-headings:font-space-grotesk prose-p:font-inter prose-a:text-black">
               <h1 className="text-[11vw] sm:text-[9vw] md:text-[7vw] lg:text-[5.5vw] leading-[0.9] tracking-tight font-bold font-space-grotesk text-black mix-blend-exclusion mb-12 break-words hyphens-auto">Datenschutzerklärung</h1>

               <section className="mb-8">
                 <h2 className="text-xl font-semibold text-black mb-4">1. Verantwortliche Stelle</h2>
                 <p className="text-gray-700">
                   Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
                   <strong>Benedikt Schnupp</strong><br />
                   Danziger Str. 126A, 12161 Berlin<br />
                   E-Mail: mail@benediktschnupp.com
                 </p>
               </section>

               <section className="mb-8">
                 <h2 className="text-xl font-semibold text-black mb-4">2. Datenschutz auf einen Blick</h2>
                 <p className="text-gray-700 mb-4">
                   Beim Besuch dieser Website werden automatisch technische Daten erfasst (Server-Logfiles). Außerdem nutzen wir
                   <strong> Vercel Web Analytics</strong> und <strong>Vercel Speed Insights</strong> für eine cookielose, datensparsame Reichweitenmessung.
                   Personalisierte Profile werden nicht erstellt.
                 </p>
                 <p className="text-gray-700">
                   Sie haben u. a. das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch gegen
                   Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde.
                 </p>
               </section>

               <section className="mb-8">
                 <h2 className="text-xl font-semibold text-black mb-4">3. Hosting (Vercel)</h2>
                 <p className="text-gray-700 mb-4">
                   Diese Website wird bei <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, USA, gehostet.
                   Beim Aufruf der Website werden durch Vercel Server-Logfiles verarbeitet, die Ihr Browser automatisch übermittelt:
                 </p>
                 <ul className="list-disc pl-6 text-gray-700 mb-4">
                   <li>IP-Adresse (gekürzt/anonymisiert nach Vercel-Standard),</li>
                   <li>Datum und Uhrzeit der Anfrage, Zeitzone,</li>
                   <li>URL/Referrer,</li>
                   <li>HTTP-Statuscode, übertragene Datenmenge,</li>
                   <li>User-Agent (Browser, Betriebssystem).</li>
                 </ul>
                 <p className="text-gray-700 mb-4">
                   Die Verarbeitung ist zur Bereitstellung, Stabilität und Sicherheit der Website erforderlich (Art. 6 Abs. 1 lit. f DSGVO).
                   Mit Vercel besteht ggf. ein Vertrag zur Auftragsverarbeitung. Eine Datenübermittlung in die USA kann stattfinden; wir stützen
                   diese auf Art. 46 DSGVO (Standardvertragsklauseln) bzw. ein gültiges Angemessenheitsinstrument.
                 </p>
               </section>

               <section className="mb-8">
                 <h2 className="text-xl font-semibold text-black mb-4">4. Cookielose Reichweitenmessung & Performance</h2>

                 <h3 className="text-lg font-semibold text-black mb-2">4.1 Vercel Web Analytics</h3>
                 <p className="text-gray-700 mb-3">
                   Wir verwenden <strong>@vercel/analytics</strong> zur statistischen Auswertung der Nutzung unserer Seiten.
                   Das Tracking erfolgt <strong>ohne Cookies</strong> und ohne persistente Identifikatoren. Es werden aggregierte Metriken
                   zu Seitenaufrufen, Referrern, Geräten, Ländern etc. erhoben. Rechtsgrundlage ist unser berechtigtes Interesse
                   an einer datensparsamen Reichweitenmessung (Art. 6 Abs. 1 lit. f DSGVO).
                 </p>
                 <p className="text-gray-700 mb-6">
                   Sie können der Verarbeitung aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit widersprechen
                   (Art. 21 DSGVO). Da keine Cookies eingesetzt werden, ist kein Cookie-Banner für dieses Tool erforderlich.
                 </p>

                 <h3 className="text-lg font-semibold text-black mb-2">4.2 Vercel Speed Insights</h3>
                 <p className="text-gray-700">
                   Wir nutzen <strong>@vercel/speed-insights</strong>, um Web-Vitals und Performance-Metriken zu erfassen
                   (z. B. LCP, FID, CLS). Die Erhebung erfolgt <strong>cookielos</strong> und dient der technischen Optimierung unserer Website
                   (Art. 6 Abs. 1 lit. f DSGVO).
                 </p>
               </section>

               <section className="mb-8">
                 <h2 className="text-xl font-semibold text-black mb-4">5. Eingesetzte Bibliotheken & Drittinhalte</h2>
                 <p className="text-gray-700 mb-4">
                   Die folgenden Bibliotheken werden primär zur <strong>Darstellung und Interaktion</strong> genutzt und verarbeiten
                   selbst keine personenbezogenen Daten zu eigenen Zwecken: <em>next, react, react-dom, tailwindcss, @tailwindcss/typography,
                   framer-motion, gsap, lenis, screenfull, lucide-react, next-seo, gray-matter, remark, remark-html</em>.
                 </p>

                 <h3 className="text-lg font-semibold text-black mb-2">5.1 Video-Einbettungen (react-player)</h3>
                 <p className="text-gray-700 mb-3">
                   Für Video-Inhalte verwenden wir <strong>react-player</strong>. Abhängig von der jeweiligen Quelle (z. B. YouTube, Vimeo)
                   kann beim Laden des Players eine Verbindung zu Servern des Anbieters aufgebaut werden. Dabei können diese Anbieter
                   eigene Daten (inkl. Cookies oder ähnlicher Technologien) verarbeiten und Daten in Drittländer (z. B. USA) übertragen.
                 </p>
                 <p className="text-gray-700 mb-3">
                   <strong>Hinweis:</strong> Wenn wir eine „Klick-zum-Laden“-Lösung einsetzen, werden externe Inhalte erst nach Ihrem aktiven Klick geladen.
                   Erst dann findet eine Datenübertragung an den jeweiligen Anbieter statt. Rechtsgrundlage in diesem Fall ist Ihre Einwilligung
                   (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit mit Wirkung für die Zukunft widerrufen können.
                 </p>
                 <p className="text-gray-700">
                   Ohne „Klick-zum-Laden“ stützen wir die Einbindung auf unser berechtigtes Interesse an einer ansprechenden Darstellung
                   unserer Inhalte (Art. 6 Abs. 1 lit. f DSGVO). Bitte beachten Sie die Datenschutzhinweise der jeweiligen Anbieter.
                 </p>
               </section>

               <section className="mb-8">
                 <h2 className="text-xl font-semibold text-black mb-4">6. Kontaktaufnahme</h2>
                 <p className="text-gray-700">
                   Bei Kontaktaufnahme per E-Mail verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage (Art. 6 Abs. 1 lit. b DSGVO,
                   ggf. Art. 6 Abs. 1 lit. f DSGVO). Die Daten werden gelöscht, sobald sie für die Zweck­erfüllung nicht mehr erforderlich sind.
                 </p>
               </section>

               <section className="mb-8">
                 <h2 className="text-xl font-semibold text-black mb-4">7. Ihre Rechte</h2>
                 <ul className="list-disc pl-6 text-gray-700 mb-4">
                   <li>Auskunft (Art. 15 DSGVO),</li>
                   <li>Berichtigung (Art. 16 DSGVO),</li>
                   <li>Löschung (Art. 17 DSGVO),</li>
                   <li>Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
                   <li>Datenübertragbarkeit (Art. 20 DSGVO),</li>
                   <li>Widerspruch gegen Verarbeitungen (Art. 21 DSGVO),</li>
                   <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO).</li>
                 </ul>
               </section>

               <section className="mb-8">
                 <h2 className="text-xl font-semibold text-black mb-4">8. Aktualität und Änderungen</h2>
                 <p className="text-gray-700">
                   Wir passen diese Datenschutzerklärung an, sobald technische oder rechtliche Änderungen dies erforderlich machen.
                   Stand: 01.09.2025
                 </p>
               </section>
             </div>
           </div>
         </main>
         
       </div>
       
       <Footer />
     </div>
    </>
  )
}

export default Datenschutzerklaerung