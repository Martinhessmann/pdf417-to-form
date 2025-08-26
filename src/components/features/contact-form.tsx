import { useState } from 'react';

// Image assets from Figma
const imgBattery =
  'http://localhost:3845/assets/db99d2ed7682f87726826c0ee7fecaa52d0e2b22.svg';
const imgWifi =
  'http://localhost:3845/assets/8a72b3e2e05a2fe7a7aad21708f7e5dc478f113a.svg';
const imgSignal =
  'http://localhost:3845/assets/bf321db2d3cd6dc9a810aa901ec33100ccaa1a67.svg';

interface FormData {
  formularcode: string;
  formularcodeErganzung: string;
  versionsnummer: string;
  nachname: string;
  vorname: string;
  geburtsdatum: string;
  versicherungsschutzEnde: string;
  kostentragerkennung: string;
  versichertenId: string;
  versichertenart: string;
  besonderePersonengruppe: string;
  dmpKennzeichnung: string;
  nebenBetriebsstattennummer: string;
  lanrArztnummer: string;
  ausstellungsdatum: string;
  heilmittelart: string;
  icd10GmCode: string;
  zweiterIcd10GmCode: string;
  diagnosegruppe: string;
  leitsymptomatik: string;
  patientenindividuelleLeitsymptomatik: string;
  heilmittelErsteZeile: string;
  behandlungseinheitenHeilmittel: string;
  zweitesHeilmittel: string;
  behandlungseinheitenZweitesHeilmittel: string;
  drittesHeilmittel: string;
  behandlungseinheitenDrittesHeilmittel: string;
  erganzendesHeilmittel: string;
  behandlungseinheitenErganzendesHeilmittel: string;
  therapiefrequenz: string;
  therapiebericht: string;
  hausbesuch: string;
}

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    formularcode: '13',
    formularcodeErganzung: '',
    versionsnummer: '9',
    nachname: 'Soltert',
    vorname: 'Benjamin',
    geburtsdatum: '19940622',
    versicherungsschutzEnde: '',
    kostentragerkennung: '101575519',
    versichertenId: 'D483155529',
    versichertenart: '5',
    besonderePersonengruppe: '0',
    dmpKennzeichnung: '0',
    nebenBetriebsstattennummer: '148305200',
    lanrArztnummer: '889810411',
    ausstellungsdatum: '20241231',
    heilmittelart: '1',
    icd10GmCode: 'S83.2',
    zweiterIcd10GmCode: '',
    diagnosegruppe: 'EX',
    leitsymptomatik: 'b',
    patientenindividuelleLeitsymptomatik: '',
    heilmittelErsteZeile: 'KG',
    behandlungseinheitenHeilmittel: '6',
    zweitesHeilmittel: '',
    behandlungseinheitenZweitesHeilmittel: '',
    drittesHeilmittel: '',
    behandlungseinheitenDrittesHeilmittel: '',
    erganzendesHeilmittel: '',
    behandlungseinheitenErganzendesHeilmittel: '',
    therapiefrequenz: '1-3x woech.',
    therapiebericht: '',
    hausbesuch: '0',
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  const renderField = (
    label: string,
    field: keyof FormData,
    placeholder?: string
  ) => (
    <div className="bg-background content-stretch flex flex-col items-start justify-start relative shrink-0 w-full">
      <div className="bg-background content-stretch flex flex-col items-start justify-start relative shrink-0 w-full">
        <div className="box-border content-stretch flex items-start justify-between pb-0.5 pt-6 px-4 relative shrink-0 w-full">
          <div className="basis-0 font-outfit font-semibold grow leading-[0] min-h-px min-w-px relative shrink-0 text-text-primary text-[18px]">
            <p className="leading-[normal]">{label}</p>
          </div>
        </div>
      </div>
      <div className="bg-background box-border content-stretch flex flex-col items-start justify-start px-4 py-2 relative shrink-0 w-full">
        <div className="bg-input-bg box-border content-stretch flex gap-2 items-center justify-start px-[13px] py-[13.5px] relative rounded-[16px] shrink-0 w-full">
          <input
            type="text"
            value={formData[field]}
            onChange={e => handleInputChange(field, e.target.value)}
            placeholder={placeholder || ''}
            className="basis-0 flex flex-col font-outfit font-normal grow justify-center leading-[0] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[17px] text-text-secondary text-nowrap bg-transparent border-none outline-none w-full"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background content-stretch flex flex-col isolate items-start justify-start relative size-full min-h-screen">
      {/* Header Navigation Bar With Title */}
      <div className="bg-background content-stretch flex flex-col h-[104px] items-start justify-start overflow-clip relative shrink-0 w-full z-[3]">
        {/* Status Bar */}
        <div className="h-14 overflow-clip relative shrink-0 w-full">
          <div className="absolute font-inter font-semibold leading-[0] left-8 not-italic text-text-primary text-[17px] text-nowrap top-[17px]">
            <p className="leading-[normal] whitespace-pre">10:00</p>
          </div>
          <div className="absolute h-[14.5px] right-8 top-5 w-[78.5px]">
            <div className="absolute h-[11px] left-[55.5px] top-[3px] w-[23.5px]">
              <img
                alt="Battery"
                className="block max-w-none size-full"
                src={imgBattery}
              />
            </div>
            <div className="absolute bottom-[0.5px] h-[13px] left-[31.5px] w-[17px]">
              <img
                alt="Wifi"
                className="block max-w-none size-full"
                src={imgWifi}
              />
            </div>
            <div className="absolute h-3.5 left-0 top-0 w-[23.5px]">
              <img
                alt="Signal"
                className="block max-w-none size-full"
                src={imgSignal}
              />
            </div>
          </div>
        </div>
        {/* Navigation Bar */}
        <div className="basis-0 grow min-h-px min-w-px overflow-clip relative shrink-0 w-full">
          <div className="absolute font-outfit font-semibold leading-[0] left-[196.5px] overflow-ellipsis overflow-hidden text-text-primary text-[17px] text-center text-nowrap top-[13.5px] translate-x-[-50%] w-[201px]">
            <p className="leading-[normal] overflow-inherit">Contact Form</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-stretch flex flex-col isolate items-start justify-start relative shrink-0 w-full z-[2]">
        <form onSubmit={handleSubmit} className="w-full">
          {/* Form Fields */}
          <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full z-[9]">
            {renderField('Formularcode', 'formularcode')}
            {renderField('Formularcodeergänzung', 'formularcodeErganzung')}
            {renderField('Versionsnummer', 'versionsnummer')}
            {renderField('Nachname', 'nachname')}
          </div>

          <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full z-[8]">
            {renderField('Vorname', 'vorname')}
            {renderField('Geburtsdatum (JJJJMMTT)', 'geburtsdatum')}
            {renderField(
              'Versicherungsschutz Ende (JJJJMMTT)',
              'versicherungsschutzEnde'
            )}
            {renderField('Kostenträgerkennung', 'kostentragerkennung')}
          </div>

          <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full z-[7]">
            {renderField('Versicherten-ID', 'versichertenId')}
            {renderField('Versichertenart', 'versichertenart')}
            {renderField('Besondere Personengruppe', 'besonderePersonengruppe')}
            {renderField('DMP-Kennzeichnung', 'dmpKennzeichnung')}
          </div>

          <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full z-[6]">
            {renderField(
              '(Neben-)Betriebsstättennummer',
              'nebenBetriebsstattennummer'
            )}
            {renderField('LANR (Arztnummer)', 'lanrArztnummer')}
            {renderField('Ausstellungsdatum (JJJJMMTT)', 'ausstellungsdatum')}
            {renderField(
              'Heilmittelart (1=Physio, …, 5=Ernährung)',
              'heilmittelart'
            )}
          </div>

          <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full z-[5]">
            {renderField('ICD-10-GM-Code', 'icd10GmCode')}
            {renderField('Zweiter ICD-10-GM-Code', 'zweiterIcd10GmCode')}
            {renderField('Diagnosegruppe', 'diagnosegruppe')}
            {renderField(
              'Leitsymptomatik gemäß Heilmittelkatalog',
              'leitsymptomatik'
            )}
          </div>

          <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full z-[4]">
            {renderField(
              'Patientenindividuelle Leitsymptomatik',
              'patientenindividuelleLeitsymptomatik'
            )}
            {renderField('Heilmittel (erste Zeile)', 'heilmittelErsteZeile')}
            {renderField(
              'Behandlungseinheiten Heilmittel',
              'behandlungseinheitenHeilmittel'
            )}
            {renderField('Zweites Heilmittel', 'zweitesHeilmittel')}
          </div>

          <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full z-[3]">
            {renderField(
              'Behandlungseinheiten Zweites Heilmittel',
              'behandlungseinheitenZweitesHeilmittel'
            )}
            {renderField('Drittes Heilmittel', 'drittesHeilmittel')}
            {renderField(
              'Behandlungseinheiten Drittes Heilmittel',
              'behandlungseinheitenDrittesHeilmittel'
            )}
            {renderField('Ergänzendes Heilmittel', 'erganzendesHeilmittel')}
          </div>

          <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full z-[2]">
            {renderField(
              'Behandlungseinheiten Ergänzendes Heilmittel',
              'behandlungseinheitenErganzendesHeilmittel'
            )}
            {renderField('Therapiefrequenz', 'therapiefrequenz')}
            {renderField(
              'Therapiebericht (1 = ja angekreuzt)',
              'therapiebericht'
            )}
            {renderField('Hausbesuch (0 = nein, 1 = ja)', 'hausbesuch')}
          </div>

          {/* Submit Button */}
          <div className="bg-background box-border content-stretch flex gap-4 items-start justify-start p-[16px] relative shrink-0 w-full z-[1]">
            <button
              type="submit"
              className="basis-0 bg-primary box-border content-stretch flex gap-2 grow h-[50px] items-center justify-center min-h-px min-w-px overflow-clip px-4 py-[14.5px] relative rounded-[48px] shrink-0"
            >
              <div className="basis-0 font-outfit font-semibold grow leading-[0] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-black text-[17px] text-center text-nowrap">
                <p className="leading-[1.35] overflow-inherit">Submit</p>
              </div>
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Bar */}
      <div className="bg-background content-stretch flex flex-col items-start justify-end overflow-clip relative shrink-0 w-full z-[1]">
        <div className="h-8 overflow-clip relative shrink-0 w-full">
          <div
            className="absolute bg-input-bg bottom-2 h-1 rounded-[360px] translate-x-[-50%] w-[120px]"
            style={{ left: 'calc(50% + 0.5px)' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
