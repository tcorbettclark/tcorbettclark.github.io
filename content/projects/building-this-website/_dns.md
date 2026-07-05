Configuring DNS is complex and messy due to lots of history and changes in attitude towards security.

This mini-guide covers XXX and the basics of DNS configuration for email.

## DNS Configuration for Email

To understand how to configure the relevant DNS records, first we need to understand the basics of how email works.

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

### The email headers and the envelope headers

Emails have metadata headers at the top.
They accompany the message payload throughout its entire lifecycle.
Examples include `From:`, `To:`, `Subject:`, `Date:`, `Message-ID:`, and `DKIM-Signature:`.

The protocol layer (SMTP) also involves headers in the "email envelope" which are exchanged between MTAs.
The envelope only lives in memory, although some headers in the envelope are copied into (differently named) headers in the email. Example envelope headers include `MAIL FROM` and `RCPT TO`.

So the envelope headers at the start of the handshake might contain:
- `MAIL FROM` e.g. marketing@some-company.com
- `RCPT TO` e.g. bob@customer.com

And the email headers might contain::
- `Return-Path:` e.g. marketing@some-company.com (added automatically by the destination MDA from the `MAIL FROM` envelope header)
- `From:` e.g. ceo@some-company.com
- `To:` e.g. bob@customer.com

An important email header is the `Received:` header.
The various components add to this header as they process and pass around the email.
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

Note that different software may use slight variants of this format.
Also, some corporate systems may scrub the `Received:` header e.g. for privacy reasons.

### SPF (Sender Policy Framework)

This is the first of the DNS settings relating to email.

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

The domain the user sees in the email (the `From:` header) may not match the domain in the `Return-Path` header (copied from the `MAIL FROM` envelope header by the MDA). *So spoofed email can pass SPF.*

### DKIM (DomainKeys Identified Mail)

#### What is it?

A cryptographic signature that confirms an email was created by the sender's domain and has not been tampered with.

#### How does it work?

The sending email server signs the email with a private key and puts the signature in a `DKIM-Signature:` email header.
The receiving email server verifies the signature using the public key from the DKIM record found in the DNS TXT record `<selector>._domainkey.<domain>`.

TODO: CNAME or TXT record?


The "selector" part is a short string used to name the signing server.
In a large organisation, multiple servers may all be signing email for the same domain (e.g. for scale, but also by vendors for different purpose such as marketing).
Obviously we don't want to share the same private key.
Further, selectors are used to rotate keys without invalidating existing signatures by creating new keys with new selectors, waiting for DNS propagation to complete, before removing the old selectors.

#### Example

```
v=DKIM1; k=rsa; p=
```

DKIM-Signature:
```
DKIM-Signature: v=DKIM1; k=rsa; p=
```

#### Weakness

DKIM prooves that a domain signed the message, but it does not prove that the signing domains matches the domain the human sees (e.g. from the `From:`: header).

### DMARC (Domain-based Message Authentication, Reporting, and Conformance)

#### What is it?

An extension to SPF and DKIM that
- aligns the `From:` header with the `MAIL FROM` envelope header used by SPF and/or the domain validated by DKIM, and
- provides a policy on what to do if an email fails DMARC alignment.

#### How does it work?

A DNS TXT recortd (`_dmarc.<domain>`) specifies the policy for email delivery. When a receiving email server checks for DMARC alignment, it uses this policy to determine if or how to report failures to the domain owner.

#### Example

```
v=DMARC1; p=none; rua=mailto:
```



### Sender Rewriting Scheme (SRS) and Authenticated Received Chain (ARC)

To understand SRS and ARC, it's helpful to first understand how `Return-Path:` email header.

The `Return-Path:` header does not exist until final delivery.
It is added by the MDA (Mail Delivery Agent) just before storage.
It is taken from the final `MAIL FROM` envelope header in the SMTP transaction, which was passed along from MTA to MTA.
Usually the `MAIL FROM` is unchanged down the chain from the original sender.
But it can be different, for example when using mailing lists or forwarders.

Forwarders will use a Sender Rewriting Scheme (SRS) protocol so that the SPF check passes for the handshake from the forwarder to the next MTA.
Without it, the receiever would reject the email because the forwarder is not authorized to send on behalf of the original sender.
SRS rewrites the `MAIL FROM` header to a temporary address that passes the SPF check, so that the next MTA can verify the handshake.

The ARC header is added by the MDA after SRS rewriting, and is used to verify the integrity of the email chain.


#### Example

```
ARC-Message-Signature: 
```


---

## TODO

### How does DKIM work if MTAs add headers to the email? Won't this break the signature?

TODO

### How does all this solves the email forwarding problem?

TODO

What should a forwarding email do with the `Return-Path:` header? Does reply to email use it or the `From:` header?

MX records?!

RECPT TO?
