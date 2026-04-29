/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for mobile11</Preview>
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
          <Heading style={h1}>Confirm your identity</Heading>
          <Text style={text}>Use the code below to confirm your identity:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footerText}>
            This code will expire shortly. If you didn't request this, you can
            safely ignore this email.
          </Text>
        </Section>
        <Section style={footer}>
          <Text style={footerBrand}>© {new Date().getFullYear()} mobile11. Unlimited Data Everywhere.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#f5f3ee', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const }
const header = { padding: '30px 25px 20px', textAlign: 'center' as const, borderBottom: '1px solid #E5E7EB' }
const content = { padding: '30px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2d3748', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#0093FF',
  margin: '0 0 30px',
  letterSpacing: '4px',
}
const footerText = { fontSize: '13px', color: '#9CA3AF', margin: '30px 0 0' }
const footer = { padding: '20px 25px', backgroundColor: '#f5f3ee', textAlign: 'center' as const }
const footerBrand = { fontSize: '12px', color: '#9CA3AF', margin: '0' }
