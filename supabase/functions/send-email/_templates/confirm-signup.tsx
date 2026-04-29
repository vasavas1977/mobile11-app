import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface ConfirmSignupEmailProps {
  token: string
}

export const ConfirmSignupEmail = ({ token }: ConfirmSignupEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your mobile11 account - Your verification code inside</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Heading style={h1}>mobile11</Heading>
        </div>

        <div style={content}>
          <Heading style={h2}>Confirm Your Email</Heading>
          
          <Text style={text}>
            Thanks for signing up! You're one step away from unlimited data in 200+ countries. 
            Please enter this verification code to confirm your email address.
          </Text>

          <div style={codeContainer}>
            <div style={codeBox}>
              <div style={codeText}>{token}</div>
            </div>
            <Text style={codeHelper}>Enter this 6-digit code in the app</Text>
          </div>

          <div style={features}>
            <div style={feature}>
              <Text style={featureTitle}>🌐 Unlimited Data</Text>
              <Text style={featureText}>No speed caps or data limits</Text>
            </div>
            <div style={feature}>
              <Text style={featureTitle}>⚡ Instant Activation</Text>
              <Text style={featureText}>Ready in seconds after purchase</Text>
            </div>
            <div style={feature}>
              <Text style={featureTitle}>🗺️ 200+ Countries</Text>
              <Text style={featureText}>Stay connected worldwide</Text>
            </div>
          </div>

          <Hr style={divider} />

          <Text style={footerText}>
            This code will expire in 1 hour. If you didn't create an account, you can safely ignore this email.
          </Text>
        </div>

        <div style={footer}>
          <Text style={footerSmall}>
            mobile11 - Stay Connected Anywhere
          </Text>
          <Text style={footerSmall}>
            Questions? Contact us at support@mobile11.com
          </Text>
        </div>
      </Container>
    </Body>
  </Html>
)

export default ConfirmSignupEmail

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
}

const header = {
  background: 'linear-gradient(135deg, #0093FF 0%, #9B5DFF 100%)',
  padding: '30px 20px',
  textAlign: 'center' as const,
  borderRadius: '12px 12px 0 0',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '1px',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '40px 30px',
  borderRadius: '0 0 12px 12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const h2 = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 30px 0',
  textAlign: 'center' as const,
}

const codeContainer = {
  textAlign: 'center' as const,
  margin: '40px 0',
}

const codeBox = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #0093FF 0%, #9B5DFF 100%)',
  padding: '20px 40px',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0, 147, 255, 0.3)',
}

const codeText = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#ffffff',
  letterSpacing: '8px',
  fontFamily: '"Courier New", monospace',
  margin: '0',
}

const codeHelper = {
  marginTop: '20px',
  fontSize: '14px',
  color: '#64748b',
}

const features = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '20px',
  margin: '30px 0',
}

const feature = {
  textAlign: 'center' as const,
}

const featureTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: '0 0 8px 0',
}

const featureText = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '30px 0',
}

const footerText = {
  fontSize: '14px',
  color: '#64748b',
  textAlign: 'center' as const,
  margin: '30px 0 0 0',
}

const footer = {
  marginTop: '30px',
  textAlign: 'center' as const,
}

const footerSmall = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '8px 0',
}
