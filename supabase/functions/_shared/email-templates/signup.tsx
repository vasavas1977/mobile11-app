/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for mobile11</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png"
            alt="mobile11"
            height="36"
            style={{ margin: '0 auto' }}
          />
        </Section>
        <Section style={content}>
          <Heading style={h1}>Confirm your email</Heading>
          <Text style={text}>
            Thanks for signing up for{' '}
            <Link href={siteUrl} style={link}>
              <strong>mobile11</strong>
            </Link>
            !
          </Text>
          <Text style={text}>
            Please confirm your email address (
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            ) by clicking the button below:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Verify Email
          </Button>
          <Text style={footerText}>
            If you didn't create an account, you can safely ignore this email.
          </Text>
        </Section>
        <Section style={footer}>
          <Text style={footerBrand}>© {new Date().getFullYear()} mobile11. Unlimited Data Everywhere.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#f5f3ee', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const }
const header = { padding: '30px 25px 20px', textAlign: 'center' as const, borderBottom: '1px solid #E5E7EB' }
const content = { padding: '30px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2d3748', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#0093FF', textDecoration: 'underline' }
const button = {
  backgroundColor: '#0093FF',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const footerText = { fontSize: '13px', color: '#9CA3AF', margin: '30px 0 0' }
const footer = { padding: '20px 25px', backgroundColor: '#f5f3ee', textAlign: 'center' as const }
const footerBrand = { fontSize: '12px', color: '#9CA3AF', margin: '0' }
