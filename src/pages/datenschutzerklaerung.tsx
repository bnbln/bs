import React from 'react'
import Head from 'next/head'
import Link from 'next/link'

const Datenschutzerklaerung = () => {
  return (
    <>
      <Head>
        <title>Datenschutzerklärung - Portfolio</title>
        <meta name="description" content="Datenschutzerklärung und Informationen zum Datenschutz" />
      </Head>
      
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
            <h1 className="text-3xl font-bold text-black mb-8">Datenschutzerklärung</h1>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-lg font-semibold text-black mb-3">Allgemeine Hinweise</h3>
              <p className="text-gray-700 mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
              </p>

              <h3 className="text-lg font-semibold text-black mb-3">Datenerfassung auf dieser Website</h3>
              <p className="text-gray-700 mb-4">
                <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Wie erfassen wir Ihre Daten?</strong><br />
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Wofür nutzen wir Ihre Daten?</strong><br />
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>
              <p className="text-gray-700">
                <strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong><br />
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">2. Hosting</h2>
              <p className="text-gray-700 mb-4">
                Wir hosten unsere Website bei [Name des Hosting-Anbieters]. Der Hoster erhebt in sog. Logfiles folgende Daten, die Ihr Browser an uns übermittelt:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>IP-Adresse</li>
                <li>die Adresse der vorher besuchten Website (Referer Anfrage-Header)</li>
                <li>Datum und Uhrzeit der Anfrage</li>
                <li>Zeitzonendifferenz zur Greenwich Mean Time (GMT)</li>
                <li>Inhalt der Anforderung</li>
                <li>Zugriffsstatus/HTTP-Statuscode</li>
                <li>übertragene Datenmenge</li>
                <li>Website, von der die Anforderung kommt</li>
                <li>Browser</li>
                <li>Betriebssystem und dessen Oberfläche</li>
                <li>Sprache und Version der Browsersoftware</li>
              </ul>
              <p className="text-gray-700">
                Das ist erforderlich, um unsere Website anzuzeigen und die Stabilität und Sicherheit zu gewährleisten. Dies entspricht unserem berechtigten Interesse im Sinne des Art. 6 Abs. 1 S. 1 lit. f DSGVO.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-lg font-semibold text-black mb-3">Datenschutz</h3>
              <p className="text-gray-700 mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>
              <p className="text-gray-700 mb-4">
                Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
              </p>
              <p className="text-gray-700">
                Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">4. Datenerfassung auf dieser Website</h2>
              
              <h3 className="text-lg font-semibold text-black mb-3">Kontaktformular</h3>
              <p className="text-gray-700 mb-4">
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
              </p>
              <p className="text-gray-700">
                Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sofern diese abgefragt wurde; die Einwilligung ist jederzeit widerrufbar.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">5. Analyse-Tools und Tools von Drittanbietern</h2>
              <p className="text-gray-700 mb-4">
                Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor allem mit sogenannten Analyseprogrammen.
              </p>
              <p className="text-gray-700">
                Detaillierte Informationen zu diesen Analyseprogrammen finden Sie in der folgenden Datenschutzerklärung.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">6. Plugins und Tools</h2>
              <p className="text-gray-700">
                Diese Website bindet eventuell Inhalte von Drittanbietern ein. Diese können theoretisch Cookies setzen, z. B. wenn Sie eine Seite mit eingebetteten Inhalten aufrufen. Bitte informieren Sie sich bei den jeweiligen Drittanbietern über deren Datenschutzrichtlinien.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

export default Datenschutzerklaerung 