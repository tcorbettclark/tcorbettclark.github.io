Configuring DNS is complex and messy due to lots of improvements to the internet over a long time, and an arms race between malevolent misuse and attempts to defend.

This mini-guide covers XXX-TODO-XXX and the basics of DNS configuration for email. Be prepared for some alphabet soup!

## DNS Configuration for XXX-TODO-XXX

TODO

## DNS Configuration for Email

To understand the configuration of the relevant DNS records, it is helpful first to understand the basics of email delivery.

### The MUA, MSA, MTA, MDA, and MRA components

- The Mail User Agent (MUA) is the email client, such as Outlook or Gmail on the user's phone.

- The Mail Submission Agent (MSA) listens for incoming connections over the SMTP protocol from email clients (on a different port to that used for MTA-to-MTA communication), authenticates the user and sanitises the email headers, and then hands it off to the MTA.

- A Mail Transport Agent (MTA) takes new emails from the MSA and also listens for incoming connections from other MTAs using the SMTP protocol.
  It reads the envelope, looks up the destination DNS MX records, and forwards the message to the next MTA.
  This component shuffles email around the network from MTA to MTA until it reaches the destination MTA.

- The Mail Delivery Agent (MDA) takes email from the local MTA for delivery to local recipients.
  It applies spam filtering, inbox sorting rules, and stores the email.

- The Mail Retrieval Agent (MRA) listens for connections from MUAs using protocols such as IMAP or POP3, authenticates the user, and lets them download or read their stored emails.

An "email server" consists of some combination of these components.
Most often it is used informally to refer to the MTA component.

### The lifecycle of a typical email

Now we have defined the components, it is easy to describe the lifecycle of a typical email.

1. The sender's MUA sends an email to the sender's MSA.
2. The MSA sanitises the email headers and hands it off to the MTA.
3. The MTA reads the envelope, looks up the destination DNS MX records, and forwards the message to the next MTA.
4. The MTA-to-MTA hops continue until the email arrives at the destination MTA.
5. The destination MTA passes the email to the MDA, which stores it in the user's mailbox.
6. The MRA waits for users to connect and ask to download or read their stored emails.

### The envelope headers

The **envelope headers** are part of the SMTP handshake between MTAs.
They only live in memory.
But some envelope headers are copied into (differently named) headers in the email (see below).

Example envelope headers are:
- `MAIL FROM` e.g. marketing@some-company.com
- `RCPT TO` e.g. bob@customer.com

### The email headers

Emails have metadata headers before the body text.
They accompany the message payload throughout its entire lifecycle.
Examples include `From:`, `To:`, `Subject:`, `Date:`, `Message-ID:`, and `DKIM-Signature:`.

Example email headers are:
- `Return-Path:` e.g. marketing@some-company.com
- `From:` e.g. ceo@some-company.com
- `To:` e.g. bob@customer.com

Some headers are created at source by the MUA, and some are added by the MTAs in transit or by the MDA on arrival.

The `Return-Path:` header only exists upon final delivery, when it is added by the MDA (Mail Delivery Agent) just before storage.
It is copied from the final `MAIL FROM` envelope header in the final SMTP transaction with the destination MTA.
Usually the `MAIL FROM` is passed on unchanged down the chain from the original sender.
But it can be different, for example when using mailing lists or forwarders (more on this later).
The `Return-Path:` header is only used by the systems under various failures to deliver.
A user replying to an email will use the `From:` header (or the `Reply-To:` header if set).

An important email header is the `Received:` header.
The various components (MRAs, MTAs, MDAs, secure gateways, mailing list managers, proxies etc) add to this header as they process and pass around the email.
The most recent entry is at the top.
The standard template governed by RFC 5321 is:

```
Received: from [Sending Server Name/IP] 
          by [Receiving Server Name] 
          with [Protocol/Encryption] 
          id [Unique Internal Queue ID]
          for <[Target Recipient]>; 
          [Timestamp]
```

Different software may use slight variants of this format.
Also, some corporate systems may scrub the `Received:` header e.g. for privacy reasons.

### MX records

#### What is it?

A DNS MX record providing a target hostname (destination MTA) along with a priority number.
Multiple MX records can be specified, with the lower numbered (higher priority) servers being tried first.

#### How does it work?

The receiving MTA takes the domain from the `RECPT TO` in the SMTP envelope, looks up the corresponding MX record in DNS, and uses the target hostname(s) to connect to the destination MTA. Note that for reasons of scale, this isn't usually point-to-point but will involve relay or gateway MTAs along the way.

#### Example

An example MX record for the `example.com` zone might be:
```
example.com. IN MX 10 mail.example.com.
```

Note the trailing dots.
Without them, the values are interpreted as relative to the zone, i.e. `example.com` in the example above.
Then `mail.example.com` (without the trailing dot) would be interpreted as `mail.example.com.example.com`.


### SPF (Sender Policy Framework)

This is the first of the DNS settings relating to email security.

#### What is it?

A DNS TXT record listing the IP addresses authorised to send email for the domain.

#### How does it work?

The receiving MTA takes the domain from the `MAIL FROM` in the SMTP envelope, looks up the corresponding SPF record in DNS, and validates the senders IP against the record.

#### Example

For example, the TXT record might look like this:

```
v=spf1 ip4:192.0.2.0/24 include:_spf.google.com ~all
```

Breaking this down:

- `v=spf1` - The version of the SPF record.
- `ip4:192.0.2.0/24` - Allows IPs in the 192.0.2.0/24 range.
- `include:_spf.google.com` - Includes the Google SPF record.
- `~all` - Allows any IP that passes the SPF check, but does not require it.

#### Weakness

The domain the user sees in the email (the `From:` header) may not match the domain in the `Return-Path` header (copied from the `MAIL FROM` envelope header by the MDA).
*So spoofed email can pass SPF.*

### DKIM (DomainKeys Identified Mail)

#### What is it?

A cryptographic signature that confirms an email was created by the sender's domain and has not been tampered with.

#### How does it work?

The sending email server signs the email with a private key and puts the signature in a `DKIM-Signature:` email header.
The receiving email server verifies the signature using the public key from the DKIM record found in the DNS TXT record `<selector>._domainkey.<domain>`.

The "selector" part is a short string used to refer to a signing server.
In a large organisation, multiple servers may all be signing email for the same domain (e.g. for scale, but also by vendors for different purpose such as marketing).
Obviously we don't want to share the same private key, so the selector approach means we can have multiple signing servers each with their own key.
Selectors are also used to rotate keys without invalidating existing signatures by creating new keys with new selectors, waiting for DNS propagation to complete, and then removing the old selectors.

The DKIM record can be in a TXT record or use a CNAME record pointing to a TXT record on another domain managing DKIM on your behalf (e.g. Google Workspace or Mailchip). This also allows the the third party to rotate keys without you needing to update your DNS records.

#### Example

A 2048 bit RSA key DKIM DNS TXT record called `s1._domain.example.com` will look like this (it is a single line, but shown split across multiple lines for readability)
```
v=DKIM1; 
k=rsa;
p=MIIBIjANBgkqhkiG9...[truncated for brevity]...vQIDAQAB
```

Breakdown of the fields:
- `v=DKIM1` indicates the version of DKIM being used.
- `k=rsa` indicates the key type (RSA).
- `p=` is the base64-encoded public key.

The `DKIM-Signature` email header will look like this:
```
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=s1;
     h=from:to:subject:date:message-id:cc;
     bh=2jmj7l5rSw0yVb/vlWAYkK/YBwk=;
     b=cXBlcmllbmNl...
```

(unlike DNS records, line breaks are allowed in email headers so long as they follow the "Header Folding" rules)

The fields break down as follows:
- `v=1` indicates the version of DKIM being used.
- `a=rsa-sha256` indicates the algorithm used for signing.
- `c=relaxed/relaxed` indicates the canonicalization algorithm used to format the email headers and body before signing.
- `d=example.com` is the domain being signed.
- `s=s1` is the selector used in the DNS record to find the public key.
- `h=from:to:subject:date:message-id:cc` are the headers included in the signature.
- `bh=2jmj7l5rSw0yVb/vlWAYkK/YBwk=` is the base64-encoded hash of the canonicalized email body (no headers).
- `b=cXBlcmllbmNl...` is the base64-encoded signature of the headers listed in the `h=` field and the `bh=` string.

The `h` field can contain duplicates, e.g. `h=from:from:to:subject:date:message-id:cc`, even when there is only a single `From` header in the email. This approach detects "header injection" attacks, when a malicious actor adds duplicate headers to an email to trick the recipient into thinking the email came from a different domain. This works because the signing algorithm includes missing headers as nulls in the hash.

Note that altered headers causes the signature to fail verification. Altered body content will pass the signature verification because it uses the `bh=` value, but the hash of the body will be different. This is still considered an overall DKIM verification failure.

#### Weakness

DKIM proves that the original domain signed the message, but it does not prove that the signing domain matches the domain seen by humans (e.g. in the `From:`: header).
An attacker could sign an email from a domain that is a different from the domain in the `From:` header.
In other words, the domain in the `d=` field does not have to match the domain in the `From:` header for the DKIM verification to pass.

Also, DKIM gives a false negative in the case of valid email body alteration, such as a mailing list adding a footer or a security gateway cleaning an email.

### DMARC (Domain-based Message Authentication, Reporting, and Conformance)

#### What is it?

An extension to SPF and DKIM that
- aligns the `From:` header with the `MAIL FROM` envelope header used by SPF and/or the domain validated by DKIM, and
- provides a policy on what to do if an email fails DMARC alignment.

Alignment can be strict (exact match of domain in the DKIM `d=` field and the email `From:` header) or relaxed (subdomain match e.g. `d=mail.yourbank.com` aligns with `From: yourbank.com`). The default is relaxed alignment.

#### How does it work?

A DNS TXT record (`_dmarc.<domain>`) specifies the policy for email delivery. When a receiving email server checks for DMARC alignment, it uses this policy to determine if or how to report failures to the domain owner.

#### Example

A typical DNS TXT `_dmarc.<domain>` record is as follows (actually one line, but split here for readability):
```
v=DMARC1;
p=quarantine;
pct=100;
rua=mailto:dmarc-reports@example.com;
ruf=mailto:dmarc-failures@example.com;
aspf=r;
adkim=s
```

The fields break down as follows:
- `v=DMARC1` indicates the protocol version (mandatory, must be first tag, must be uppercase)
- `p=quarantine` indicates the policy for failed DMARC validation: none (monitor only), quarantine (spam folder), or reject (block)
- `pct=100` indicates the percentage of failing messages the policy applies to (default 100)
- `rua=mailto:...` indicates where receivers send daily aggregate reports (optional but recommended)
- `ruf=mailto:...` indicates where receivers send per-message forensic reports (optional, often unsupported due to privacy regulations)
- `aspf=r` indicates SPF alignment strictness: r (relaxed, allows subdomain matches) or s (strict, exact match)
- `adkim=r` indicates DKIM alignment strictness: r (relaxed, allows subdomain matches) or s (strict, exact match)

Both DKIM and SPF aligment compare against the `From:` email header. DKIM takes the domain from the `d=` tag in the DKIM signature, while SPF takes the domain from the `MAIN FROM` envelope header (or equivalently, the `Return-Path:` email header).

#### Weakness

Inherits the weakness of DKIM - giving false negatives in the case of valid email body changes.

### Sender Rewriting Scheme (SRS) and Authenticated Received Chain (ARC)

Although it does not affect any further DNS settings, the above SPF+DKIM+DMARC does not work with forwarders.
This is where SRS and ARC come in.
Forwarders will use a Sender Rewriting Scheme (SRS) protocol so that the SPF check passes for the handshake from the forwarder to the next MTA.
Without it, the receiever would reject the email because the forwarder is not authorized to send on behalf of the original sender.
SRS rewrites the `MAIL FROM` header to a temporary address that passes the SPF check, so that the next MTA can verify the handshake.

The ARC header is added by the MDA after SRS rewriting, and is used to verify the integrity of the email chain.


#### Example

TODO: SRS

Example ARC email header:

```
ARC-Message-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=arc; t=1628712000;
    h=from:to:subject:date:message-id:arc-authentication-results;
    bh=;
    b=
```



Return to question about email body being changed, perhaps legitimately by MTD stripping dodgy attachments or adding extra content with a corporate message.
