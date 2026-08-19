import { ContentSection, PageIntro } from "@/components/public-content";

export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Privacy notice"
        title="An initial privacy notice for an early-stage technology product."
        description="This notice describes the information NHI Shield may process while the product and pilot programme are under development. It requires formal legal review before commercial deployment."
      />
      <ContentSection title="Information we may receive" tone="white">
        <p>
          Visitors may provide contact details, organisation information, role, industry, organisation size and the content of a pilot or general enquiry. Authenticated users may provide account and authentication information managed through Supabase Auth.
        </p>
        <p>
          During product validation, operational and security information may be processed to operate the application, protect accounts, investigate faults and maintain an audit trail.
        </p>
      </ContentSection>
      <ContentSection title="Purpose and safeguards">
        <p>
          Information may be used to respond to enquiries, evaluate pilot interest, provide account access, maintain platform security and improve the product. Access is limited according to role and organisational membership. The foundation uses server-side authorization, tenant isolation and database Row Level Security.
        </p>
        <p>
          NHI Shield is designed to minimise unnecessary data collection and to retain information only for as long as it serves a defined operational, security or legal purpose.
        </p>
      </ContentSection>
      <ContentSection title="Rights and requests" tone="teal">
        <p>
          Subject to applicable law, individuals may request access to, correction of or deletion of their personal information. To make a request, use the contact route on this website and describe the information and action requested. We may need to verify identity before responding.
        </p>
        <p>
          This notice considers South Africa&apos;s Protection of Personal Information Act (POPIA) at a high level. It is not legal advice and does not state that NHI Shield is POPIA certified.
        </p>
      </ContentSection>
      <ContentSection title="Third-party infrastructure and review">
        <p>
          The product uses third-party infrastructure providers, including Supabase, for hosting database and authentication services. Their processing is subject to their own terms and policies.
        </p>
        <p>
          Formal vendor, cross-border transfer, retention and incident-response review is required before commercial deployment. For privacy questions or correction/deletion requests, contact the NHI Shield project through the contact page.
        </p>
      </ContentSection>
    </>
  );
}
