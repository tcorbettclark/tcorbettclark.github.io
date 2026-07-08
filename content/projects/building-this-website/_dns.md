Configuring DNS is complex and messy due to
- its origin before the internet was a global network;
- changes in how the internet is used;
- improvements to the internet infrastructure;
- the need to keep operating through these changes; and
- an arms race between malevolent misuse and attempts to defend.

My aim here is to systematically explain enough to understand the DNS settings needed for a website with email.
I try not to get too bogged down in the multifarious edge cases, but still cover those areas which confused me initially, such as: _What's going on with the `@` or the trailing dot on domains? Why can't there be muliple CNAME records? Do we need to quote the value of a TXT record, and why? Why do we have SPF, DKIM, and DMARC records? Why doesn't changing the email headers during transit break DKIM signatures?_.

## DNS for website content

This is the most common DNS configuration, and involves the `A` and `CNAME` records needed to resolve the domain name to an IP address.

### A records

The DNS `A` record maps a domain name to an IP address.

For example,
```
@ A 188.166.138.147
www.example.com. A 188.166.138.147
blog A 198.51.100.1
```

The first column (`@`, `www.example.com.`, `blog`) represents the domain name or subdomain being configured.

The `@` symbol represents the "zone origin", which is a value set in the DNS zone file.
It is usually set to the root domain, e.g. with 
```
$ORIGIN example.com.
```

A name with a trailing dot (`example.com.`) is a fully qualified domain name (FQDN), while a name without a trailing dot (`blog`) is relative to the zone origin.

So the above example could have been written as:
```
example.com. A 188.166.138.147
www.example.com. A 188.166.138.147
blog.example.com. A 198.51.100.1
```

These rules about the `@` and trailing dots apply to all DNS record types, not just the A records.

### CNAME records

A DNS `CNAME` record is a "DNS alias" to redirect a lookup to another domain.
For example,
```
www.corbettclark.com. CNAME corbettclark.com
```

This indirection applies to all DNS record types, not just the A records.
So if a CNAME exists for a hostname, essentially no other records for that hostname can be defined.

### GitHub

To prove to GitHub that you own the domain, you need to add a `TXT` record whose hostname is `_github-pages-challenge-<username>.<your-domain>`.
For example,
```
_github-pages-challenge-<username>.example.com. TXT <some string provided by GitHub>
```

To use GitHub Pages to host content as I do on this website, [follow these instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

### Google

To prove to Google that you own the domain and hence unlock use of the [Google search console](https://search.google.com/search-console), you need to add a `TXT` record for the root domain.
For example:
```
@ TXT google-site-verification=<some string provided by Google>
```

### Apple

To prove to Apple that you own the domain e.g. to use custom email domains, you need to add a `TXT` record for the root domain. 
For example:
```
@ TXT apple-domain-verification=<some string provided by Apple>
```

## DNS for Email

To understand the configuration of the relevant DNS records for email, it is helpful first to understand the basics of email delivery.

### Components

Email creation, transmission, and delivery involves several components, each with a specific role:

- The Mail User Agent (**MUA**) is the email client, such as Outlook or Gmail on the user's phone.

- The Mail Submission Agent (**MSA**) listens for incoming connections over the SMTP protocol from MUAs (on a different port to that used by MTAs), authenticates the user and sanitises the email headers, and then hands it off to the MTA.

- The Mail Transport Agent (**MTA**) takes new emails from the MSA and also listens for incoming connections from other MTAs using the SMTP protocol.
  It either forwards the message to the next MTA or delivers it to the MDA if it is destined for the local domain.

- The Mail Delivery Agent (**MDA**) takes email from the local MTA for delivery to local recipients.
  It applies spam filtering, inbox sorting rules, and stores the email.

- The Mail Access Agent (**MAA**) listens for connections from MUAs using protocols such as IMAP or POP3 to allow authenticated users download or read their stored emails.

- A Mail Retrieval Agent (**MRA**) acts as an automated client, fetching emails from the MAA on behalf of the user e.g. so they are available locally or to pull emails from multiple systems into a single mailbox.

An "email server" consists of some combination of these components.
Most often it is used informally to refer to the MTA component.

The lifecycle of a typical email as it moves between these components is as follows:

1. The sender's MUA sends an email to the sender's MSA.
2. The MSA sanitises the email headers and hands it off to the MTA.
3. The MTA reads the envelope, looks up the destination DNS MX records, and forwards the message to the next MTA.
4. The MTA-to-MTA hops continue until the email arrives at the destination MTA.
5. The destination MTA passes the email to the MDA, which stores it in the user's mailbox.
6. The MAA waits for MUAs to connect, authenticate, and ask to view or download stored emails.

There are other names for components with similarly functionality and purpose to those in the Mxx model.
For some, it's debatable whether they are aliases, extensions, or new component types.
- **Mailing List Managers (MLM)** expand a single incoming alias into multiple recipient addresses before the email is handed off to the MTA.
- **Secure Email Gateway** often includes an MTA but provides additional security features such as encryption and edge security filtering.
- **SMTP Proxy** does not handle queuing or independent routing (like an MTA), but inspects or filters traffic for spam or malware before passing it on.
- **Email Forwarders** take an incoming email sent to one address and immediately re-sends ("forwards") it to another address.

### Envelope headers

The **envelope headers** are exchanged as part of the SMTP handshake e.g. between MTAs.
They only live in memory.
But some envelope headers are copied into (differently named) email headers (see below).
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

Some headers are created at source by the MUA, some are added by the MTAs and other components in transit, and some are added by the MDA on arrival.

The `Return-Path:` header is created by the MDA just before the email is stored.
It is copied from the `MAIL FROM` envelope header in the final SMTP transaction with the destination MTA.
Usually the `MAIL FROM` is passed on unchanged down the chain from the original sender.
But it can be different, for example when using mailing lists or forwarders (more on this later).
The `Return-Path:` header is only used by the systems under various failures to deliver.
A user replying to an email will use the `From:` header (or the `Reply-To:` header if set).

An important email header is the `Received:` header.
The various components (MTAs, MDAs, secure email gateways, mailing list managers, proxies etc) add to this header as they process and pass around the email.
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

Other examples of email headers being added or modified:
- Mailing List Managers will add `List-Id:`, `List-Unsubscribe:`, etc headers to the email. Also adjust the `Reply-To:` to the list address so user replies go to the list, and adjust the `Return-Path:` header so bounces go to the MLM.
- Email Proxies will add headers like `X-Proxied-By` and `X-Original-Client-IP`.
- Secure Email Gateways will add headers like `X-Spam-Status:` and `X-Spam-Level:`, `X-Virus-Scanned` to record scores and virus detection results. They may also strip headers like `Received:` to hinder reconnaissance by attackers.

Beware that despite appearances, "Envelope-From" is *not* an email header but a casual reference to the `MAIL FROM` envelope header.

### MX records

DNS MX records are the address book for email delivery.

#### What is it?

A DNS MX record provides a target hostname (destination MTA) along with a priority number.
Multiple MX records can be specified, with the lower numbered (higher priority) servers being tried first.

#### How does it work?

The receiving MTA takes the domain from the `RCPT TO` in the SMTP envelope, looks up the corresponding MX record in DNS, and uses the target hostname(s) to connect to the destination MTA (or Secure Email Gateways, Proxies, etc).

#### Example

An example MX record for the `example.com` zone might be:
```
@ MX 10 mail.example.com.
```

This means email for the `example.com` domain should be delivered to `mail.example.com` with priority 10.

If no MX records exist for a domain, MTAs fall back to using the domain's A record (RFC 5321).

### SPF

The Sender Policy Framework (SPF) gives rise to the first of the DNS records relating to email security.

#### What is it?

A DNS TXT record describing the IP addresses authorised to send email for the domain.

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
- `~all` - Accept the message but flag it as probably unauthorized (SoftFail) in the `Received-SPF` email header; the sender's IP does not match the record.

Note that in the underlying zone file, the DNS TXT value must be quoted because the file uses a format based upon space-separated columns.
Missing quotes causes the spaces in the TXT value to be treated as different columns.
Whether quotes are needed depends on the interface used to set the TXT record i.e. some interfaces add the quotes for you.

#### Weakness

The domain the user sees in the email (the `From:` header) may not match the domain in the `Return-Path` header (copied from the `MAIL FROM` envelope header by the MDA).
*So spoofed email can pass SPF.*

### DKIM

DomainKeys Identified Mail (DKIM) gives rise to the second DNS record used for email security. It works together with an email header.

#### What is it?

A cryptographic signature that confirms an email was created by the sender's domain and has not been tampered with since.

#### How does it work?

The sending email server signs the email with a private key and puts the signature in a `DKIM-Signature:` email header.
The receiving email server verifies the signature using the public key from the DKIM record found in the DNS TXT record `<selector>._domainkey.<domain>`.

The "selector" part is a short string used to refer to a signing server.
In a large organisation, multiple servers may all be signing email for the same domain (e.g. for scale, but also by vendors for different purpose such as marketing).
Obviously we don't want to share the same private key, so the selector approach means we can have multiple signing servers each with their own key.
Selectors are also used to rotate keys without invalidating existing signatures by creating new keys with new selectors, waiting for DNS propagation to complete, and then removing the old selectors.

The DKIM record can be in a TXT record or use a CNAME record pointing to a TXT record on another domain managing DKIM on your behalf (e.g. Google Workspace or Mailchimp). This also allows the the third party to rotate keys without you needing to update your DNS records.

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
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
     d=example.com;
     s=s1;
     h=from:to:subject:date:message-id:cc;
     bh=2jmj7l5rSw0yVb/vlWAYkK/YBwk=;
     b=cXBlcmllbmNl...
```

(Unlike DNS records, line breaks are allowed in email headers so long as they follow the "Header Folding" rules. This optional formatting for humans consequently requires canonicalisation of the headers and body before signing.)

The fields break down as follows:
- `v=1` indicates the version of DKIM being used.
- `a=rsa-sha256` indicates the algorithm used for signing.
- `c=relaxed/relaxed` indicates the canonicalization algorithm used to format the email headers and body before signing.
- `d=example.com` is the domain being signed.
- `s=s1` is the selector used in the DNS record to find the public key.
- `h=from:to:subject:date:message-id:cc` are the headers included in the signature.
- `bh=2jmj7l5rSw0yVb/vlWAYkK/YBwk=` is the base64-encoded hash of the canonicalized email body (no headers).
- `b=cXBlcmllbmNl...` is the base64-encoded signature of the headers listed in the `h=` field and the `bh=` string.

The `h=` field can contain duplicates, e.g. 
```
h=from:from:to:subject:date:message-id:cc
```
even when there is only a single `From:` header in the email.
This approach detects "header injection" attacks, when a malicious actor adds duplicate headers to an email to trick the recipient into thinking the email came from a different domain.
The duplicate field approach works because the signing algorithm uses nulls for missing headers in the hash.

Note that altered headers cause the signature to fail verification.
Altered *body* content will also cause verification failure because the recomputed body hash will not match the `bh=` value stored in the signature.

#### Weakness

DKIM proves that the original domain signed the message, but it does not prove that the signing domain matches the domain seen by humans (e.g. in the `From:`: header).
An attacker could sign an email from a domain that is a different from the domain in the `From:` header.
So DKIM verification can pass even if the domain in the `d=` field fails to match the domain in the `From:` header.

Also, DKIM gives a false negative in the case of valid email body alteration, such as a mailing list adding a footer or a security gateway cleaning an email by removing a dangerous attachment.

### DMARC 

Domain-based Message Authentication, Reporting, and Conformance (DMARC) gives rise to the third DNS record used for email security.

#### What is it?

DMARC has two aspects:
- aligning the `From:` header with the `MAIL FROM` envelope header used by SPF and the domain validated by DKIM, and
- providing a policy on what to do if an email fails DMARC alignment.

The policy is specified in a DNS TXT record, `_dmarc.<domain>`.

Both DKIM and SPF alignment compare against the `From:` email header.
DKIM takes the domain from the `d=` tag in the DKIM signature, while SPF takes the domain from the `MAIL FROM` envelope header (or equivalently, the `Return-Path:` email header).
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
adkim=r
```

The fields break down as follows:
- `v=DMARC1` indicates the protocol version
- `p=quarantine` indicates the policy for failed DMARC validation: none (monitor only), quarantine (spam folder), or reject (block)
- `pct=100` indicates the percentage of failing messages the policy applies to (default 100)
- `rua=mailto:...` indicates where receivers send daily aggregate reports (optional but recommended)
- `ruf=mailto:...` indicates where receivers send per-message forensic reports (optional, often unsupported due to privacy regulations)
- `aspf=r` indicates SPF alignment strictness: r (relaxed, allows subdomain matches) or s (strict, exact match)
- `adkim=r` indicates DKIM alignment strictness: r (relaxed, allows subdomain matches) or s (strict, exact match)

#### Weakness

DMARC inherits the weakness of DKIM i.e. giving false negatives in the case of valid email body changes.

### SRS

The above SPF+DKIM+DMARC combination does not work with forwarders for several reasons:
- if the forwarder uses the original `MAIL FROM` envelope header, it will not pass the SPF check,
- the forwarder may validly alter the email body and so cause DKIM verification to fail.

The solution does not involve any further DNS records, but I may as well complete the story as it is (a) mildly interesting and (b) you may come across SRS and ARC.

#### What is it?

The Sender Rewriting Scheme (SRS) is a protocol used by forwarders to pass the SPF check, even though they are not the original sender and therefore not in the SPF IP allowlist.

#### How does it work?

Forwarders use the SRS protocol to rewrite the `MAIL FROM` envelope header so that it comes from the forwarder's domain.

Upon arrival at the MDA, the `Return-Path` email header is copied from this modified `MAIL FROM` envelope header.
SRS passes DKIM verification because it only results in changes to the `Return-Path` email header, which is not included in the `h=` field list of the DKIM signature.

The SRS protocol is stateless in the sense that the forwarder does not need to maintain any state about the original sender.
The rewritten `MAIL FROM` header contains all the information needed to (for example) return a bounced email.

#### Example

Say an email to `alice@origin.com` is being forwarded by `forwarder.com`. The SRS protocol would rewrite the `MAIL FROM` header to something like:

```
SRS0=h4X9=ZL=origin.com=alice@forwarder.com
```

The general format is:
```
SRS0 = <Signature> = <Timestamp> = <Original Domain> = <Original Local-Part> @ forwarder.com
```

The fields break down as follows:
- `SRS0`: The protocol tag indicating this is a primary forward.
- `<Signature>`: A small, unique cryptographic hash (typically the first 4 characters of a base64-encoded HMAC-SHA1 token). This hash is generated by combining a secret key known only to the forwarding server with the timestamp, original domain, and original local-part.
- `<Timestamp>`: A cyclic, base-32-encoded day counter (2 characters) indicating when the rewrite happened (Unix time / 86400 mod 2^10, giving a ~3.5 year cycle).
- `<Original Domain>` & `<Original Local-Part>`: The complete data needed to reconstruct the original sender address.

### ARC

Authenticated Received Chain (ARC) is a solution to the false negative DMARC verification in the case of emails being modified by secure gateways (e.g. removing dangerous looking attachment) or mailing list managers (appending a corporate message). It works by creating a "chain of custody", with each hop verifying the integrity of the previous hop.

Upon arrival at the modifying MTA, three ARC headers are created before passing it on:

- `ARC-Authentication-Results (AAR)`: A snapshot of the authentication status (SPF, DKIM, DMARC) at the exact moment the intermediary received it.
- `ARC-Message-Signature (AMS)`: A DKIM-like cryptographic signature of the message content taken after the intermediary modified it, ensuring no subsequent hops tamper with their modifications.
- `ARC-Seal (AS)`: A cryptographic seal that binds the previous ARC headers together, preventing anyone from manipulating or faking the history chain.

If multiple such modifying MTAs are involved, multiple sets of ARC headers are created.

When the destination MTA receives the email, it sees a DMARC failure.
However, instead of instantly rejecting the mail, it looks for the ARC headers.
If these verify ok and the MTA trusts the intermediaries, it overrides the DMARC failure and delivers the mail to the MDA.

## DNS propagation and TTL

Every DNS record has a Time To Live (TTL) value (in seconds) that tells caching resolvers how long to keep the record before re-fetching it.
This means changes to DNS records can take up to the TTL duration to propagate across the internet.
This is especially important for DKIM key rotation: you should publish the new key under a new selector, wait at least the TTL of the old record, and only then remove the old selector.

## PTR (reverse DNS)

A PTR record maps an IP address back to a hostname (the reverse of an A record).
Many receiving MTAs reject or penalise email from IPs that lack a matching PTR record, so reverse DNS is important for email deliverability.
PTR records are configured by the owner of the IP address (usually your hosting provider), not in your domain's DNS zone.

## DNSSEC

DNSSEC adds cryptographic signatures to DNS records, allowing resolvers to verify that responses have not been tampered with.
For email, DNSSEC strengthens the chain of trust for DKIM and DMARC lookups: without it, an attacker who can forge DNS responses could substitute their own public key or policy record.
DNSSEC is configured by signing your zone and publishing DS records via your registrar, but adoption remains limited.

## A complete example

Here are the essential DNS records with annotations for this website (with email).

### Website

{.table-sm}
| Type | Name | Value | Description |
|------|------|-------|-------------|
| CNAME | www | corbettclark.com | Redirect to the main domain |
| A | @ | 185.199.108.153 | GitHub Pages |
| A | @ | 185.199.109.153 | GitHub Pages |
| A | @ | 185.199.110.153 | GitHub Pages |
| A | @ | 185.199.111.153 | GitHub Pages |

### Proof of Ownership

{.table-sm}
| Type | Name | Value | Description |
|------|------|-------|-------------|
| TXT | _github-pages-challenge-tcorbettclark | 06641c751f43ce63675aeb4e0f2e7c | Verify ownership for GitHub |
| TXT | @ | google-site-verification=ZH-EAeAUJNCippUlct13h5H5gwloTQVM5xDVu42tSgI | Verify ownership for Google |
| TXT | @ | apple-domain=pVgsR3iHhOa4Hw46 | Verify ownership for Apple |

### Email

{.table-sm}
| Type | Name | Value | Description |
|------|------|-------|-------------|
| MX | @ | mx01.mail.icloud.com (10) | MX record for inbound Apple email |
| MX | @ | mx02.mail.icloud.com (10) | MX record for inbound Apple email |
| TXT | @ | v=spf1 include:icloud.com ~all | SPF for outbound Apple email |
| CNAME | sig1._domainkey | sig1.dkim.corbettclark.com.at.icloudmailadmin.com | DKIM for outbound Apple email |
| TXT | _dmarc | v=DMARC1; p=quarantine | DMARC record for outbound Apple Mail |
