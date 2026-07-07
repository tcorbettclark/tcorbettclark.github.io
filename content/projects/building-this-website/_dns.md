Configuring DNS is complex and messy due to
- its origin before the internet was a global network;
- changes to how the internet is used, both of type and scale;
- improvements to the internet infrastructure;
- the need to keep operating through these changes; and
- an arms race between malevolent misuse and attempts to defend.

My aim here is to explain enough to understand the DNS settings needed for a website with email, but without getting too bogged down in the multifarious edge cases.

## DNS for XXX-TODO-XXX

TODO

## DNS for Email

To understand the configuration of the relevant DNS records for email, it is helpful first to understand the basics of email delivery.

### Mxx components

Email creation, transmission, and delivery involves several components, each with a specific role:

- The Mail User Agent (MUA) is the email client, such as Outlook or Gmail on the user's phone.

- The Mail Submission Agent (MSA) listens for incoming connections over the SMTP protocol from MUAs (on a different port to that used for MTA-to-MTA communication), authenticates the user and sanitises the email headers, and then hands it off to the MTA.

- A Mail Transport Agent (MTA) takes new emails from the MSA and also listens for incoming connections from other MTAs using the SMTP protocol.
  It either forwards the message to the next MTA or delivers it to the MDA if it is destined for the local domain.

- The Mail Delivery Agent (MDA) takes email from the local MTA for delivery to local recipients.
  It applies spam filtering, inbox sorting rules, and stores the email.

- The Mail Retrieval Agent (MRA) listens for connections from MUAs using protocols such as IMAP or POP3 to allow authenticated users download or read their stored emails.

An "email server" consists of some combination of these components.
Most often it is used informally to refer to the MTA component.

The lifecycle of a typical email is as follows:

1. The sender's MUA sends an email to the sender's MSA.
2. The MSA sanitises the email headers and hands it off to the MTA.
3. The MTA reads the envelope, looks up the destination DNS MX records, and forwards the message to the next MTA.
4. The MTA-to-MTA hops continue until the email arrives at the destination MTA.
5. The destination MTA passes the email to the MDA, which stores it in the user's mailbox.
6. The MRA waits for users to connect and ask to download or read their stored emails.


### Envelope headers

The **envelope headers** are part of the SMTP handshake between MTAs.
They only live in memory.
But some envelope headers are copied into (differently named) headers in the email headers (see below).
Example envelope headers are:
- `MAIL FROM` e.g. marketing@some-company.com
- `RCPT TO` e.g. bob@customer.com

### Email headers

An email has metadata headers before the body text.
These headers accompany the message payload throughout its entire lifecycle.
Example email headers are:
- `Return-Path:` e.g. marketing@some-company.com
- `From:` e.g. ceo@some-company.com
- `To:` e.g. bob@customer.com

Some headers are created at source by the MUA, some are added by the MTAs in transit, and some are added by the MDA on arrival.

The `Return-Path:` header only exists upon final delivery, when it is added by the MDA (Mail Delivery Agent) just before the email is stored.
It is copied from the final `MAIL FROM` envelope header in the final SMTP transaction with the destination MTA.
Usually the `MAIL FROM` is passed on unchanged down the chain from the original sender.
But it can be different, for example when using mailing lists or forwarders (more on this later).
The `Return-Path:` header is only used by the systems under various failures to deliver.
A user replying to an email will use the `From:` header (or the `Reply-To:` header if set).

An important email header is the `Received:` header.
The various components (MRAs, MTAs, MDAs, secure gateways, mailing list managers, proxies etc) add to this header as they process and pass around the email.
The most recent entry is at the top.
The standard template governed by RFC 5321 is:

```text
Received: from [Sending Server Name/IP] 
          by [Receiving Server Name] 
          with [Protocol/Encryption] 
          id [Unique Internal Queue ID]
          for <[Target Recipient]>; 
          [Timestamp]
```

Different software may use slight variants of this format.
Also, some corporate systems may scrub the `Received:` header e.g. for privacy reasons.

### MX record

DNS MX records are the address book for email delivery.

#### What is it?

A DNS MX record provides a target hostname (destination MTA) along with a priority number.
Multiple MX records can be specified, with the lower numbered (higher priority) servers being tried first.

#### How does it work?

The receiving MTA takes the domain from the `RECPT TO` in the SMTP envelope, looks up the corresponding MX record in DNS, and uses the target hostname(s) to connect to the destination MTA. Note that for reasons of scale, this isn't usually point-to-point but will involve relay or gateway MTAs along the way.

#### Example

An example MX record for the `example.com` zone might be:
```
example.com. MX 10 mail.example.com.
```

This means email for the `example.com` domain should be delivered to `mail.example.com` with priority 10.

Note the trailing dots.
Without them, the values are interpreted as relative to the "zone origin", which is a value set in the DNS zone file e.g. with 
```dns
$ORIGIN example.com.
```
Then `mail.example.com` (without the trailing dot) would be interpreted as `mail.example.com.example.com`.

The `@` symbol can also be used to indicate the zone origin, so the previous example MX record could have been written:
```
@ MX 10 mail.example.com.
```

### SPF

The Sender Policy Framework (SPF) gives rise to the first of the DNS records relating to email security.

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

Note that in the underlying zone file, the DNS TXT value must be quoted because the file uses a format based upon space separated columns.
Missing quotes causes the spaces in the TXT value to be treated as different columns.
Whether quotes are needed depends on the interface used to set the TXT record i.e. some interfaces add the quotes for you.

#### Weakness

The domain the user sees in the email (the `From:` header) may not match the domain in the `Return-Path` header (copied from the `MAIL FROM` envelope header by the MDA).
*So spoofed email can pass SPF.*

### DKIM

DomainKeys Identified Mail (DKIM) gives rise to the second DNS record used for email security. It works together with an email header.

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

An RSA key DKIM DNS TXT record called `s1._domain.example.com` will look like this (it is a single quoted line, but shown split across multiple lines for readability):
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

(Unlike DNS records, line breaks are allowed in email headers so long as they follow the "Header Folding" rules. This optional formating for humans consequently requires canonicalisation of the headers and body before signing.)

The fields break down as follows:
- `v=1` indicates the version of DKIM being used.
- `a=rsa-sha256` indicates the algorithm used for signing.
- `c=relaxed/relaxed` indicates the canonicalization algorithm used to format the email headers and body before signing.
- `d=example.com` is the domain being signed.
- `s=s1` is the selector used in the DNS record to find the public key.
- `h=from:to:subject:date:message-id:cc` are the headers included in the signature.
- `bh=2jmj7l5rSw0yVb/vlWAYkK/YBwk=` is the base64-encoded hash of the canonicalized email body (no headers).
- `b=cXBlcmllbmNl...` is the base64-encoded signature of the headers listed in the `h=` field and the `bh=` string.

The `h` field can contain duplicates, e.g. `h=from:from:to:subject:date:message-id:cc`, even when there is only a single `From:` header in the email.
This approach detects "header injection" attacks, when a malicious actor adds duplicate headers to an email to trick the recipient into thinking the email came from a different domain.
The duplicate field approach works because the signing algorithm uses nulls for missing headers in the hash.

Note that altered headers causes the signature to fail verification.
Altered *body* content will pass the signature verification because it uses the `bh=` value, but the hash of the body will be different.
But this is still considered an overall DKIM verification failure.

#### Weakness

DKIM proves that the original domain signed the message, but it does not prove that the signing domain matches the domain seen by humans (e.g. in the `From:`: header).
An attacker could sign an email from a domain that is a different from the domain in the `From:` header.
So DKIM verification can pass even if the domain in the `d=` field does not have to match the domain in the `From:` header.

Also, DKIM gives a false negative in the case of valid email body alteration, such as a mailing list adding a footer or a security gateway cleaning an email by removing a dangerous attachment.

### DMARC 

Domain-based Message Authentication, Reporting, and Conformance (DMARC) gives rise to the third DNS record used for email security.

#### What is it?

DMARC has two aspects:
- aligning the `From:` header with the `MAIL FROM` envelope header used by SPF and the domain validated by DKIM, and
- providing a policy on what to do if an email fails DMARC alignment.

The policy is specified in a DNS TXT record, `_dmarc.<domain>`.

Both DKIM and SPF aligment compare against the `From:` email header.
DKIM takes the domain from the `d=` tag in the DKIM signature, while SPF takes the domain from the `MAIN FROM` envelope header (or equivalently, the `Return-Path:` email header).
Alignment can be strict or relaxed.
Relaxed alignment allows for the DKIM or SPF domain to be a subdomain of the `From:` domain, while strict alignment requires an exact match.

#### How does it work?

The DNS TXT record `_dmarc.<domain>` specifies the policy for email delivery. If the record exists, a receiving MTA checks for DMARC alignment and uses this policy to determine if or how to report failures to the domain owner.

#### Example

A typical DNS TXT `_dmarc.<domain>` record is as follows (again, actually one quoted line, but split here for readability):
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

#### Weakness

DMARC inherits the weakness of DKIM i.e. giving false negatives in the case of valid email body changes.

### SRS

The above SPF+DKIM+DMARC combination does not work with forwarders for severalreasons:
- the original`MAIL FROM` envelope header will not pass the SPF check,
- a rewritten `MAIL FROM` envelope header will not pass the DKIM verification,
- the forwarder may validly alter the email body and so cause DKIM verificationto fail.

The solution does not involve any further DNS records, but I may as well complete the story as it is (a) mildly interesting and (b) you may come across SRS and ARC.

#### What is it?

The Sender Rewriting Scheme (SRS) is a protocol used by forwarders to rewrite the `MAIL FROM` envelope header to a temporary address that passes the SPF check, so that the next MTA can verify the handshake.

******************** TODO: doesn't this break DKIM verification? Is this where ARC comes in?

#### How does it work?

Forwarders will use a Sender Rewriting Scheme (SRS) protocol so that the SPF check passes during the handshake from the forwarder to the next MTA.
Without it, the receiever would reject the email because the forwarder is not authorized to send on behalf of the original sender.
SRS rewrites the `MAIL FROM` envelope header to a temporary address that passes the SPF check, so that the next MTA can verify the handshake.

#### Example

Here is an example of an SRS-rewritten `MAIL FROM` header:

```
MAIL FROM: srs0=example.com=example.com=1628712000=example.com@example.com
```

### ARC

Authenticated Received Chain (ARC) is ...... TODO ...........

#### What is it?

ARC is a protocol used to verify the integrity of the email chain, after SRS rewriting.

#### How does it work?

The ARC header is added by the MDA after SRS rewriting, and is used to verify the integrity of the email chain.

Return to question about email body being changed, perhaps legitimately by MTD stripping dodgy attachments or adding extra content with a corporate message.

#### Example

Example ARC email header:

```
ARC-Message-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=arc; t=1628712000;
    h=from:to:subject:date:message-id:arc-authentication-results;
    bh=;
    b=
```

## Worked examples

### corbettclark.com

### ski-tripper.com
