import React from 'react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'

const Impressum = () => {
  return (
    <>
      <NextSeo
        title="Impressum"
        description="Impressum und rechtliche Informationen"
        noindex={true}
      />
      
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-16 py-16">
          {/* Back to Home */}
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Zurück zur Startseite
          </Link>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <h1 className="text-3xl font-bold text-black mb-8">Impressum</h1>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">Angaben gemäß § 5 TMG</h2>
              <p className="text-gray-700 mb-2">
                Benedikt Schnupp<br />
                Danziger Straße 126a<br />
                10407 Berlin
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">Kontakt</h2>
              <p className="text-gray-700 mb-2">
                E-Mail: mail@benediktschnupp.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <p className="text-gray-700 mb-2">
                Benedikt Schnupp<br />
                Danziger Straße 126a<br />
                10407 Berlin
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">Haftungsausschluss</h2>
              
              <h3 className="text-lg font-semibold text-black mb-3">Haftung für Inhalte</h3>
              <p className="text-gray-700 mb-4">
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>

              <h3 className="text-lg font-semibold text-black mb-3">Haftung für Links</h3>
              <p className="text-gray-700 mb-4">
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
              </p>

              <h3 className="text-lg font-semibold text-black mb-3">Urheberrecht</h3>
              <p className="text-gray-700 mb-4">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">Datenschutz</h2>
              <p className="text-gray-700 mb-4">
                Die Nutzung unserer Webseite ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift oder E-Mail-Adressen) erhoben werden, erfolgt dies, soweit möglich, stets auf freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche Zustimmung nicht an Dritte weitergegeben.
              </p>
              <p className="text-gray-700 mb-4">
                Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
              </p>
              <p className="text-gray-700">
                Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten durch Dritte zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit ausdrücklich widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-Mails, vor.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

export default Impressum 