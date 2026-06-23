export default function patientSlipPrompt(soapNote, language = "English") {
  return `
Create a one-page patient slip in ${language} from this physician-reviewed SOAP note.

Rules:
- Do not add any medicine, test, warning sign, diagnosis, or advice not present in the SOAP note.
- Keep language simple and patient-friendly.
- Include: medicines discussed, how/when to take ONLY if stated, tests, follow-up, danger signs, referrals.
- Add disclaimer: "This slip is based on the doctor's consultation and must be followed as advised by the treating physician."

SOAP NOTE:
${soapNote}
`;
}
