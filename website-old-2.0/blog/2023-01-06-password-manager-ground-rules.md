---
slug: 2023-01-06-password-manager-ground-rules
title: 'Password Manager Ground Rules'
draft: false
---

## Background

Its a new year and always a good time to have intentions on new behaviors. While I didn't intend on this being a new years resolution, I've recently decided that I want to start maintaining a personal password manager. I've been against this in the past because if I neglect the service, it could be hacked, I could lose it, or any number of other bad things that would make my life a lot harder than before I had the manager. Therefore, I've defined some ground rules to ease my paranoia while still increasing my security posture across all of my projects.

<!-- truncate -->

## The Rules

1. Exclude _Critical_ Secrets - Do not include master key, backup, or easy secrets in the manager.
2. Strong & Unique - All entries in the password manager should be strong and unique.
3. Use Recovery Contacts - External service entries should use recovery email addresses not in manager.
4. Exclude Recovery Access - Never include entries for external service recovery email inboxes.
5. Zero-Risk Physical Access - Non-crypt entries for services we have physical access to have near-zero risk of loss.
6. Offsite Backups - Backups of all entries to decrease the risk of data loss.
7. True Two Factor Authentication (TFA) - TFA is something you _have_ AND _know_.

### Exclude Critical Secrets

All of the above rules elude to a multi-tiered approach to managing secrets. You can think of these tiers as critical secrets, normal secrets, easy secrets.

Critical secrets are secrets that should be stored "out of band" of the password manager. These secrets include things like the master key for the password manager, the backup secrets for the password manager database, and any passwords or access methods for the recover emails of the entries in the password manager.

By "out of band", I mean that these are the passwords that should be generally known by users, but kept written down in a safe (preferably in an envelope with tamper tape) or backed up in an encrypted file whose ultimate password is also locked away.

I think this is a bit obvious, but if you store some super secure and unique backup password in the password manager and you lose the password manager, how will you restore the backup? Just like the backup password, what use is a password manager masker key if its locked inside of the password manager.

Easy secrets are passwords or PINs that we create so that they are easy to remember. **Do not include these in the password manager.** Examples of easy secrets are: birthdays, phrases, or keyboard walks. Easy secrets are secrets that I use to encrypt private keys or protect one time passcodes where the private key or OTP secret is kept in the password manager.

### Strong & Unique

If all passwords in a password manager are using the same 5 passwords everywhere, what is really the point of having a password manager? The true value in using a password manager like Google or Bitwarden is so that you can have secure and unique passwords with high entropy for each login.

Not if but when an external service is compromised and your password is leaked, assuming you've been using unique passwords, you now only need to update the one password. In contrast, you might change the one compromised _reused/common_ password, but hackers assume you've used the same leaked password everywhere and therefore can use the leaked information to attempt to login to many other common services with your email and exposed password.

### Use Recovery Contacts

One of my largest paranoias with using a personal secret manager is that if I neglect it and data becomes lost, I could lose years of reputation and history built up in various social media accounts or other services that I don't have a formal relationship with (e.g. Facebook, Google, Twitter). The obvious thing to do here is ensure that you've registered accurate recovery email addresses and phone numbers with these external services. That way, if a secret or password IS lost, the account is still recoverable.

Register the used phone numbers and recover email addresses in the manager if possible. That wat, when or if you change your phone number or country codes, it'll be easy to search what accounts you need to update the contact information for.

### Exclude Recovery Access

Ok, so assuming you are using recovery email inboxes for external services, suppose you added access to those same email inboxes in your password manager. Suppose that you password manager was left unlocked and someone got access to the external services AND the recovery email _inbox_. You've essentially just eliminated your defense in depth. Therefore, **never include access to recovery email inboxes in the password manager**.

### Zero-Risk Physical Access

If you have console access or physical access to a machine, virtual machine, or root access to a service, you can usually override any passwords on boot or via the storage of the system. This is what I refer to when I say physical access. Because we have physical access, in the worst case, if we lost all of our password manager data, we would have to bring down the services and do a hardcoded change of the credentials... or maybe just redeploy or restore from backups.

### Offsite Backups

Drives go bad, weather can be terrible, fires do happen, sea levels rise. As such, you'll always want to consider a disaster recovery plan. In laymen terms, we want to backup our data (encrypted) on a remote server. Today, this means shoving the data in cloud storage (e.g. S3 Bucket). 

Note: If you are feeling more confident in your maintenance and redundancy abilities, you could consider something like Amazon Glacier as well. I usually refrain from storing anything in Glacier because it costs significantly more to retrieve your data than it does to store it.

If storage costs are a concern, you can always setup a sort of ring buffer of the data. I like to do a progressive backup where I backup daily and monthly:

- Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Jan, Feb, Mar, Apr, Jun, Jul, Aug, Sep, Oct, Nov, Dec

When implementing this model, you setup a daily cron to backup the data. Then you setup a monthly cron to copy the backup from the day before (or the last backup). In this way, we can restore lost data within a day for 6 days if we see an issue. If a smaller corruption occurs, we can look back for a year.

Subsequently, you can create a yearly backup that captures a single month's backup for the year for even longer term capturing of long lived entries.

<details><summary>Daily Backup Script</summary>

```sh
#!/bin/sh

TARGET_PATH=/vault
DAILY_FNAME=daily-$(date +%w)
DAILY_PATH=/backups/${DAILY_FNAME}

# Wipe the old backup.
rm -rf ${DAILY_PATH}

# Create an rsync copy of data folder. (i.e. 80% solution)
mkdir -p ${DAILY_PATH}
rsync -a ${TARGET_PATH}/ ${DAILY_PATH}/

# Copied the crudely copied database.
mv ${DAILY_PATH}/db.sqlite3 ${DAILY_PATH}/db.sqlite3.crude

# Create a graceful database backup.
sqlite3 ${TARGET_PATH}/db.sqlite3 ".backup '${DAILY_PATH}/db.sqlite3'"

# Log some integrity digests
find ${DAILY_PATH} -type f -exec sha1sum {} \; > ${DAILY_PATH}.sha1sums
mv ${DAILY_PATH}.sha1sums ${DAILY_PATH}/

# Tarball the backup
tar -zcf ${DAILY_PATH}.tar.gz ${DAILY_PATH}

# Backup to Cloud
s3cmd put ${DAILY_PATH}.tar.gz s3://bucket/${DAILY_FNAME}.tar.gz
```

</details><br />

Then the monthly backup:

```sh
s3cmd put /backups/daily-$(( ((7 + $(date +%w)) - 1) % 7 )).tar.gz s3://bucket/monthly-$(date +%m).tar.gz
```

Then the yearly backup:

```sh
s3cmd put /backups/daily-$(( ((7 + $(date +%w)) - 1) % 7 )).tar.gz s3://bucket/yearly-$(date +%Y).tar.gz
```

<details><summary>Crontab</summary>

```crontab
# At 04:05
# Daily performed twice incase we're updating or something.
5 4,20 * * * /backups/daily-backup.sh
# At 05:05 on day-of-month 7
# Monthly performed twice incase we're updating or something.
5 5 7,22 * * /backups/monthly-backup.sh
# At 05:05 on day-of-month 7 in Jan, May, Sep
# Yearly performed three times incase we're updating or something.
5 5 7 1,5,9 * /backups/yearly-backup.sh
```

</details>

### True Two Factor Authentication (TFA)

The point of two factor authentication is to challenge a user that they distinctly _have_ a thing and distinctly _know_ a thing. Usually the _have_ a thing is a certificate or token. Tokens usually provide one time passcodes that are hashed or timed. Password managers can store One Time Passcodes (OTP) secrets as well. Consider for a moment, if you store an OTP secret and an associated password or pin in the same password manager, you've just eliminated the **two factor** part of the authentication.

In reality, I really need to make my life easier and I've already added several layers of defense in this whole process. Therefore, I personally loosen this rule. "Never include a _have_ secret in a password manager without an additional level of authentication (not stored in the manager)." In example, any stored OTP secrets should require an additional _known_ PIN. Also, if including any private key files or entries, they should be locked with a password.

Note: Consider real person identity private key passwords as critical and not password manager worthy.

Note: Low digit PINs should be _OK_ to secure OTP secret protected services only if the service enforces backup timers for failed logins (e.g. fail2ban).

## Risk & Reward

Now, the kind of data that I'm handling is really only incurring risk to me and my family (financially, socially, and so forth). In other words, no one's life is at risk if my secrets are exposed. Major sections of the public population will not be impacted by the loss or exposure of the secrets I'm storing. Therefore I acknowledge that while these rules are not 100% "secure" in the sense of Cyber Security Framework and associated Information Assurance standards, I believe these rules fill a practical need that will significantly increase the security posture of my internet usage and integration.

Additionally, having all of my access credentials in one place should hopefully put me in a good position to transition in a password-less future that is currently a priority effort of many major global enterprises.

## Comments

<Comments />
