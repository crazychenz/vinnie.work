---
title:  "US Naval Academy"
date:   2020-01-01 00:00:00 +0000
published: true
---

Programming Languages:

Perl 5.0 and higher - Used for backend server support and CGI scripting 

PHP 4/5 - For specific web applications involving frameworks and other standardized works.

Javascript - Used for DHTML processes and AJAX magic.

C/C++ in POSIX and CGI Environments - Used for more performance- demanding processes and programs.

Java – Experience with platform independent projects, mostly client side applications.

Past Employments:

1. US Naval Academy Programmer 
`

2. Bignell, Watkins & Hasser Inc., IT Technician (part-time) 2007 – 2008

3. Brian Tarr Builders LLC 

Education:

-High School Diploma, Annapolis High School (2002) 

-AA, Anne Arundel Community College (2004) 

-BS, University of Maryland University College (May 2008)
 
Operating Systems Experience:

Linux Kernels 2.4/2.6 (Redhat Enterprise, Ubuntu, Debian, Knoppix)

Unix (FreeBSD, Solaris 8/9/10, and Tru64)

Mac OS X (Tiger)

Windows NT4/XP/2000/2003

Other Technical Experience Includes:

•	Thorough knowledge of SMTP and IMAP protocols.
•	Extensive use of LDAP and LDIF data format in many account based and account maintenance applications.
•	Experience using SQL and designing database schemas.
•	Enterprise Apache 1/2/2.2 web server implementation and management experience.
•	Experience with building standard GNU and other open source applications or libraries from source code packages.
•	Extensive usage of BASH, VI, and EMACS in daily workflow.

Awards:

- Cash Performance Bonus, 2008, US Naval Academy

- Cash Performance Bonus, 2007, Bignell Watkins & Hasser 

- Awarded paid tuition for UMUC Degree Program by ITSD at USNA 

- Deans List in Anne Arundel Community College, 2002 and 2003 

- Eagle Scout, Boy Scouts of America, 2002 

- Computer Science Excellence Award, 2002, Annapolis High School  
A portfolio of sorts…

Active Programming Projects:

-E-Mail Archive – There was some chatter, whether or not the academy needed an email archive. I was assigned by the research department to look into developing an in-house email archive. Thus far I’ve developed an IMAP stream parser that pulls individual messages. The messages are then further broken down into their mime pieces and are store with single store concepts.

-USNA Domain Setup Utility - This is an application I designed and implemented in Visual Basic.  It is executed by incoming students first connecting to the campus network. I ask for username/password.
Using LDAP I grab any information required and setup the machine by joining the campus domain (Active Directory) and also setup several other application settings dynamically. These would include things such as setting the user's initial network wide password, setting up computer names with naming conventions and other user specific registry edits.

-Oracle - LDAP Synchronization - This is a process that I inherited and have improved on in maintenance over time. This is a Perl utility that will find differences in an Oracle database and E-Directory database.
Using LDAP and SQL protocols, the utility determines which database is authoritative over the attribute or column being compared and makes changes appropriately.

-Mirapoint E-Mail System Implementation - This is a project that involved moving 5000 students and 2500 users from separate email systems to one single email system. The email system is an appliance called Mirapoint. In the migration I have written many custom API scripts to interact with the Mirapoint appliance.  Some of the scripts do things such as move users from one server to another dynamically or manually, run daily or on demand reports, and work around many other inferior aspects of the system.

-Plebe (Freshman) Issue and User Info Central - Plebe Issue is when the IT support staff is required to deploy all of the incoming students machines in August, just before the semester starts. IT is also in charge of making sure all machines are setup correctly.  To ensure this goes as smoothly as possible, I am part of a team that designs and implements the processes that go into achieving these goals.
Another part I play is I have designed and implemented reporting utilities that supply support staff with information that is pulled from four different databases.

-MS-SQL, E-Directory, Active Directory, and Oracle.
Using all four sources we can see all network devices and match them to there directory entry, hardware platform, and operating system dynamically.

-Barber and Beauty Shop Web Interface - I was put in charge of designing and implementing a beauty and barber shop program for the campus barber shop.  It allowed students to schedule a date and time with a particular barber. The program dynamically only allowed students to choose available dates.
Reports also were generated dynamically for the barber shop manager. If needed the manager could cancel appointments and the user was notified of the changed or cancels appointment.




Past Programming Projects:

Title: Auto-Outlook Install

Where: USNA

Languages: Visual Basic 6, PHP, MS Batch

Description: USNA had been using Novell's Groupwise for about 10 years for Faculty and Staff email. They also had been using Unix email for midshipmen. In order to join everyone on the same email system, they decided that they needed an enterprise vendor solution, so they chose Mirapoint because of its previous experience in the EDU market. With the integration of Mirapoint, they also decided to support MS Outlook because of its use throughout the Navy and the NMCI Network.  I came up with a nice little process that enabled any user with a web browser to install outlook on their computer without issue.

Title: Mirapoint Configuration Compare

Where: USNA

Language: Perl

Description: When setting up Mirapoint Boxes or making configuration changes, all changes have to be manually done on each email server. To be able to do a side by side comparison of the configurations, I wrote a nice little script that would display all of the relevant settings in a table on a web page. The script was also very handy for support and their understanding of how everything was setup.

Title: Mirapoint Stats

Where: USNA

Language: Perl
Description: Mirapoint has many SNMP statistics associated with it because of its "Appliance" description. Instead of always requiring some sort of MRTG to view the stats, I simply setup a web table, just like the Mirapoint Configuration table, to view these stats and be able to compare them to all the other Mirapoint servers side by side.

Title: Mirapoint Acct Sizes

Where: USNA

Language: Perl
Description: Mirapoint has many simple things missing that you might expect to find in an email appliance. One of these is a way to tell exactly how much total space an individual is taking up on a server. I wrote this process to allow for an administrator to view sizes of accounts. 


Title: Mirapoint User Settings 

Where: USNA 

Language: Perl  
This tool is a simple utility written to assist USNA Tech Support with knowing how a user's email account is setup.

Title: Mirapoint Account Copy

Where: USNA

Language: Perl, PHP

Description: Another one of the simple features you might expect of a multi-machine appliance, is an account transfer program. Nope, it isn't supplied with the machine initially anyway. This script gives simple Mirapoint administrative protocol commands to gather everything needed to move an entire Mirapoint Account from one machine to another.


Title: Active Directory Reports

Where: USNA

Languages: Visual Basic 6, PHP, Perl, SQL

Description: In 2004 it was decided that USNA Network needed a way to make sure all students had their proper security updates applied to their machines. This was implemented and managed by Active Directory. A common problem was find users that had not had their machines previously setup and/or where not setup correctly. I wrote this program to run queries against all the Active Directory Servers and our User Directory Server to determine who was not setup correctly and what the possible errors were. This allowed a task force to be sent out to remedy a group of geographically close users.


Title: User Info Central

Where: USNA

Languages: Visual Basic 6, PHP, Perl, SQL

Description: This process was a branch off of the Active Directory 
Reports. The Active Directory Reports became very sluggish due to the amount of queries being run and therefore needed an optimizing rewrite.
User Info Central was designed from scratch to be LDAP, SQL, and ODBC compatible. Any database with these capabilities was now accessible through one central location via SQL commands. It was also setup to be web-based and allow for quick queries so that not everyone needed to know the SQL syntax to gather certain reports.


Title: Directory Lookup

Where: USNA

Language: Perl

Description: In many instances, the Information Resource Center, or IRC, needed to lookup certain user accounts from the LDAP Directory.
The only way that was currently implemented was a way to export a query on last name and then search results in Excel.
   My dirlookup webpage was a utility designed to make more advanced LDAP lookups easier for the IRC and Helpdesk. It had a simple search feature including looking up accounts based on last name or first name, but it also had an expert mode capable of looking up LDAP queries based on LDAP base, filter, scope, attributes, and with an authorized account for restricted attributes."

Title: IRC Admin Tools

Where: USNA

Language: Perl

Description: The IRC in many cases would call me to extract or make updates to certain parts of a system. When these tasks reoccurred many times, I decided to start a suite of utilities that allowed for the IRC to do these tasks themselves and at the same time the web script would check to make sure everything was done correctly.

Title: LDAP Schema Viewer

Where: USNA

Language: Perl

Description: When ever we needed a new attribute or wanted to find an existing attribute to use for what ever reason, it was always a pain to find what was already there and how it fit into the existing hierarchy of the LDAP schema. I created this app to display object classes in tree form and it also lists all attributes, and the properties of both the object classes and attributes in adjacent frames.


Title: USNA Domain Setup Utility

Where: USNA

Language: Visual Basic 6, Java 4

Description: When students are issued their computers, they have a setup procedure that they must follow to connect to everything on the network. In 2003, these procedures included a very comprehensive set of instructions describing everything needed to Join the USNA domain and setup other apps on their machine. It required a lot of user input.
  I went ahead and designed a Visual Basic app that took only a users username, password, and new password. With this I was able to eliminate
2 entire pages from the procedure booklet by automatically configuring application to the user, and setting everything needed to join the user to the active directory domain."

Title: Domain Setup Utility (Web)

Where: USNA

Language: Cscript, Perl

Description: It was decided in 2006 that not only students, but all faculty and staff were going to be required to join their computer to the active directory domain. The big difference here was that there are many different type of employments and locations of employees. A naming convention was developed to help with organizing the computer object in active directory. In order to be able to create these objects, a task force team had to visit every single machine and create the object there so that the correct information would be put in and then make sure the computer was joined to the domain completely.

Title: NDS Editor (Web)

Where: USNA

Language: Perl

Description: It became a hassle using Novell's ConsoleOne and creating LDIF files, so I wrote a web script that allowed for me to add/delete/ and modify objects in our many LDAP Directories. Referred to as the NDS editor because its initial creation was targeted for Novell's E-Directory





Title: Majordomo List Builder

Where: USNA

Language: Perl, Bash

Description: There are currently two mailing list servers at USNA. One is maintained by users, the other is dynamically created 12 times a day and is based off of the midshipmen courses and sections, and also where certain accounts exist in the directory. The Mirapoint list builder is the process that does just that.

Title: Majordomo List Search (Web)

Where: USNA

Language: Perl

Description: Users often call asking whether they are in a particular list on majordomo. I wrote this script to allow the IRC to search the lists based on userid and a result would show all the lists that particular user was a part of. There also is the option to browser the lists themselves.

Title: System Service Monitor

Where: USNA

Language: Perl

Description: System Service Monitor checks a given list of servers on a regular basis. It starts with an IP check, then a TCP check, and works its way up through all the different protocols it is able to check. If any failures are detected they can be view via the web or notified by email.

Title: Vinnie's Everything Disk

Where: USNA

Resources: Bart Boot Utils, EasyBoot

Description: While I was working in the maintenance shop we always used these 3.5" floppy disks for all troubleshooting. They constantly failed and were awfully slow. I decided to find a solution that would exist on a CD-ROM. I found several and made a compilation of all of them on a single CD. This CD came to be know as the Vinnie's Everything Disk and is now used most commonly for troubleshooting, reloading, and recovering data from end-user desktops. CD/DVD compilation is powered by Easyboot and Bartboot among other very valuable troubleshooting utilities.

Title: VED Tutorials

Where: USNA

Language: PHP / HTML

Description: The Vinnie's Everything Disk was so loaded up, I had to write some simple tutorials to help Tech Support understand how to use the disk more efficiently. These were simple picture guided steps for achieving particular tasks.

Title: VED Support and Download Site

Where: USNA

Language: PHP / HTML / phpBB2

Description: Also to help with the usage and understanding of VED, I put up a on-site support site with phpBB. Many customizations were made to phpBB, such as LDAP authentication and email digests, preventing me from having to check for new messages anywhere other than my email inbox.

Title: SuprSonicNET

Where: Personal

Language: Perl, PHP, b2Evo, phpBB2, Javascript, GWT

Description: This is my personal website that I maintain for photo viewing, Vinnie's Everything Development, and other hobby information I like to post on the web.


Title: Tetris and Breakout Clones

Client: Personal

Language: C / C++

Description: In my quest to better understand the video capabilites of
C++ I wrote a simple graphics library and then write a tetris game and
breakout game with it.


Title: 2D MUD (No name yet)
Client: Personal
Language: Java w/ RMI
Description: Still in development, I am designing and implementing a simple 2D Multi-User Dungeon game to further help my understanding of grid technology and peer-to-peer technology and how it may be applied in a business environment.

