Hey, I want to create a detailed plan for a website/platform called **Moonlight Cherry**. I would like you to ask me any clarifying questions you need and make sure we go through the important product, UX, technical, database, moderation, and infrastructure decisions before we start building.

**Do not write any code right now. Do not start building the application yet.**

The goal of this phase is to fully understand the product and create a detailed implementation plan. We should make key decisions first, identify anything that is ambiguous, and only begin development after the plan is agreed upon.

## What we're building

Moonlight Cherry is a premium anime image and GIF sharing platform/community.

The platform is primarily focused on anime artwork, character images, fan art, official artwork, wallpapers, animated GIFs, and other anime-related visual content. The platform should feel like a polished modern image-sharing community rather than a generic social network or SaaS dashboard.

The website should be designed as a real production application with multiple pages, real navigation, user accounts, uploads, profiles, search, collections, community features, moderation, administration, and a scalable media system.

This is **not supposed to be a single-page landing page**.

It should feel like a combination of a premium anime gallery, image discovery platform, and community.

The visual identity should be:

* Dark
* Premium
* Minimal
* Slightly edgy
* Modern
* Tech-inspired
* Anime-focused
* Black, white, and deep crimson/red accents
* Subtle gradients
* Subtle glass/blur effects where appropriate
* Clean typography
* Smooth but restrained animations
* Artwork should remain the primary visual focus
* Avoid generic SaaS/dashboard aesthetics

The existing brand concept uses a **cherry tree and crescent moon**, with a geometric/premium visual identity.

## Important planning requirement

Before building anything, I want you to ask me questions whenever a product decision is unclear.

Do not make major assumptions about:

* Authentication
* NSFW behavior
* User permissions
* Moderation
* Upload limits
* Storage
* Image/GIF processing
* Database structure
* Search
* Ranking algorithms
* User levels/XP
* Notifications
* Messaging
* Admin permissions
* Roles
* Monetization
* Infrastructure
* Deployment
* Performance requirements

If something needs a decision, ask me about it.

Create the plan as a Markdown document that we can continue refining together.

---

# Core Website

The public website should include real separate routes/pages rather than putting everything onto one page.

Initial public routes should include:

* `/`
* `/gallery`
* `/search`
* `/tags`
* `/tags/[tag]`
* `/characters`
* `/characters/[character]`
* `/anime`
* `/anime/[series]`
* `/i/[id]`
* `/u/[username]`
* `/collections/[id]`
* `/about`
* `/contact`
* `/terms`
* `/privacy`

Authenticated areas should include:

* `/upload`
* `/dashboard`
* `/dashboard/uploads`
* `/dashboard/favorites`
* `/dashboard/collections`
* `/dashboard/history`
* `/messages`
* `/notifications`
* `/settings`

Authentication-related routes can include:

* `/login`
* `/auth/callback`

Administrative routes should include:

* `/admin`
* `/admin/users`
* `/admin/media`
* `/admin/reports`
* `/admin/tags`
* `/admin/characters`
* `/admin/series`
* `/admin/moderation`
* `/admin/analytics`
* `/admin/settings`

The exact route structure can be adjusted if you think a better architecture makes sense, but the application should remain a proper multi-page application.

---

# Homepage

The homepage should be a dynamic discovery experience.

It should include things such as:

* Trending media
* Most liked
* Recently uploaded
* Featured characters
* Featured tags
* Popular categories
* Search
* Random image/discovery functionality
* Infinite scrolling or efficient pagination

The gallery should use a modern masonry-style layout.

The gallery should feel dynamic, with images smoothly loading and the layout continuously changing as the user explores more content.

Artwork should dominate the page rather than large amounts of text or UI.

The homepage should also be designed with performance in mind so that large amounts of media can be displayed without overwhelming the browser or server.

---

# Media System

Users should be able to upload:

* JPG/JPEG
* PNG
* WEBP
* AVIF
* GIF

The system should support animated GIFs properly.

Images should support:

* Multiple resolutions
* Thumbnails
* Optimized versions
* Lazy loading
* Responsive delivery
* Full-screen viewing
* Downloading
* Sharing
* Likes
* Favorites
* View counts
* Upload date
* Author attribution

Uploads should go through a processing pipeline.

The pipeline should be designed to handle:

1. File validation
2. File type validation
3. File size validation
4. Dimension validation
5. Image optimization
6. Thumbnail generation
7. Multiple resolution generation
8. GIF processing
9. Optional metadata/EXIF stripping
10. Moderation status
11. Final publication

The architecture should support asynchronous processing where appropriate.

Do not arbitrarily hardcode final upload limits without discussing them with me first.

The system should also have storage protection so that we can monitor storage growth and prevent the server from unexpectedly filling its disk.

---

# NSFW Content

Moonlight Cherry supports adult anime artwork.

However, NSFW content must be handled carefully.

Anonymous visitors should be able to browse the public website and discover non-NSFW content.

Anonymous users must **not** be able to view NSFW media.

Authenticated users should have an appropriate age/NSFW eligibility state before they can view NSFW content.

NSFW content must not accidentally leak through:

* Homepage thumbnails
* Search results
* Tag pages
* Character pages
* Anime pages
* User profiles
* Collections
* Recommendations
* API responses
* Metadata
* Open Graph previews

The authorization logic must be enforced server-side and not rely only on frontend hiding.

The platform must also explicitly prohibit sexual content involving minors or characters represented as minors.

We should discuss the exact age-verification/NSFW-access flow before implementation.

---

# Categories

The initial categories should include:

* Female Characters
* Male Characters
* Anime Series
* Manga Series
* Fan Art
* Official Art
* GIFs
* Wallpapers
* Cosplay
* Memes
* Other

We should decide whether media can belong to multiple categories and how category moderation should work.

---

# Tags

The platform should have a robust tagging system.

Users should be able to:

* Add tags
* Click tags
* Search tags
* Browse tag pages
* See related tags
* Receive tag autocomplete suggestions

The platform should also support:

* Trending tags
* Popular tags
* Tag usage counts
* Related tag recommendations
* User-submitted tag suggestions
* Administrative approval/rejection of tags where necessary

We should design the tagging system so it can scale to a large number of media items.

---

# Characters

Moonlight Cherry should have dedicated character pages.

Character pages should include:

* Character name
* Character image/avatar
* Anime/series association
* Related media
* Popular media
* Recent media
* Tags
* Statistics where appropriate

Users should be able to discover media through characters.

We should decide how characters are created, merged, renamed, and moderated.

---

# Anime / Series

The platform should also have dedicated anime/manga/series pages.

These should include:

* Series name
* Cover/artwork
* Description
* Related characters
* Related media
* Tags
* Popular uploads
* Recent uploads

We should decide whether series and character metadata is manually managed by administrators, user-submitted, imported from an external source, or some combination.

---

# Search

Search should be a major feature.

Users should be able to search by:

* Character
* Anime/series
* Tag
* Uploader
* Category
* Media

Advanced filtering should include things such as:

* Newest
* Oldest
* Most liked
* Most viewed
* Trending
* Category
* Tags
* Character
* Series
* NSFW eligibility

Search should be fast and scalable.

We should decide whether PostgreSQL search is sufficient or whether a dedicated search engine would eventually be appropriate.

---

# User Accounts

The platform should support user accounts.

The initial authentication concept is:

* Discord OAuth
* Google OAuth

Anonymous users should still be able to browse public non-NSFW content.

Authenticated users can gain access to:

* Uploading
* Comments
* Likes
* Favorites
* Collections
* Following
* Messaging
* Notifications
* Profile customization
* NSFW content when eligible

We should discuss whether traditional email/password authentication is necessary or whether OAuth-only authentication is preferable.

---

# User Profiles

Every user should have a public profile.

Profiles should include:

* Avatar
* Username
* Bio
* Uploaded media
* Collections
* Favorites where public
* Most-used tags
* Join date
* Social links
* Followers/following
* Activity where appropriate

Profiles should have a polished visual design and should remain focused on the user's artwork rather than looking like a generic social-media profile.

---

# Uploading

Authenticated users should have a dedicated upload experience.

The upload flow should allow users to:

* Select media
* Preview media
* Add title/description
* Select category
* Add tags
* Select character
* Select anime/series
* Mark content as NSFW
* Submit for moderation

The system should display upload progress and appropriate processing states.

We should determine whether uploads are immediately published, require moderation, or depend on the user's role/trust level.

---

# Collections

Users should be able to create collections/galleries.

Collections should support:

* Name
* Description
* Cover image
* Public/private visibility
* Media count
* Adding/removing media

Users should be able to organize their favorite artwork into collections.

---

# Community Features

The platform should include:

### Comments

* Comments
* Replies
* Likes
* Mentions
* Timestamps
* User profile links
* Comment reporting
* Moderation

### Following

Users should be able to follow other users.

Following should potentially power:

* Activity feeds
* Notifications
* Creator discovery

### Notifications

Notifications should support things such as:

* Likes
* Comments
* Replies
* Mentions
* New followers
* Moderation events
* System announcements

### Activity Feed

The platform should eventually support an activity feed showing relevant activity from followed users and the community.

---

# Direct Messages

Users should be able to send direct messages.

The initial messaging system should support:

* Text
* Emojis
* Conversations
* Timestamps
* Blocking users
* Reporting messages/users

We should discuss whether real-time messaging is necessary from the beginning or whether a simpler implementation is preferable for the initial release.

---

# Gamification

Moonlight Cherry should have a progression system.

Potential features include:

* XP
* Levels
* Badges
* Achievements
* Top uploaders
* Most-liked creators
* Daily rankings
* Weekly rankings
* Monthly rankings
* Trending media

We need to carefully design the ranking/trending algorithms so they cannot be easily manipulated through spam, bot activity, or artificial engagement.

We should discuss the exact XP sources, anti-abuse rules, and ranking formulas before implementation.

---

# Moderation

Moderation is a core part of the platform.

Users should be able to report:

* Media
* Comments
* Users
* Messages

Report categories should include:

* Illegal/prohibited content
* Harassment
* Spam
* Copyright
* Incorrect metadata
* Other

There should be a moderation queue.

Moderators should be able to:

* Approve content
* Reject content
* Remove content
* Edit metadata
* Review reports
* Warn users
* Mute users
* Timeout users
* Restrict users
* Suspend users
* Ban users

All important moderation actions should be logged.

---

# Roles & Permissions

The initial role structure should include:

* Owner
* Administrator
* Moderator
* Trusted Uploader
* User

We need proper RBAC/permission checks.

Administrative permissions must be enforced server-side.

The frontend should never be trusted to determine whether someone has administrative privileges.

We should design a clear permission matrix before implementation.

---

# Admin Panel

The admin panel should be a complete administration application, not simply a few buttons.

The dashboard should show:

* User statistics
* Upload statistics
* Uploads per day
* Storage usage
* Recent activity
* Popular tags
* Popular categories
* Moderation queue
* Reports
* System status

Admin sections should include:

### Users

* Search users
* View profiles
* Change roles
* Ban
* Suspend
* Timeout
* Mute
* Restrict
* Delete
* Warnings
* Moderation history
* Activity logs

### Media

* Search media
* Approve/reject
* Delete
* Edit metadata
* Bulk moderation
* Feature content
* Review flags

### Tags

* Create
* Edit
* Merge
* Rename
* Approve/reject suggestions

### Characters

* Create
* Edit
* Merge
* Rename
* Moderate

### Series

* Create
* Edit
* Merge
* Rename
* Moderate

### Reports

* Review reports
* Assign reports
* Resolve reports
* Reject reports
* Record moderation actions

### Analytics

* Most viewed media
* Most liked media
* Active users
* Upload trends
* Popular tags
* Popular categories
* Storage growth
* Moderation statistics

### Settings

Administrative configuration should eventually include:

* Upload limits
* Rate limits
* Moderation settings
* Feature flags
* Storage thresholds
* Site configuration
* Other platform-wide settings

---

# Security

Security should be considered throughout the architecture.

The application should account for:

* Authentication security
* Authorization
* RBAC
* CSRF protection where applicable
* XSS protection
* SQL injection protection
* Input validation
* File validation
* Upload abuse
* Rate limiting
* Spam prevention
* CAPTCHA support
* Session security
* Secure OAuth flows
* API authorization
* Admin security
* Audit logs
* Abuse prevention

Never rely exclusively on client-side validation or permissions.

---

# Performance

The server infrastructure is intentionally modest, so the application should be designed efficiently.

We care about:

* Fast page loads
* Efficient image delivery
* Lazy loading
* Responsive images
* Thumbnail usage
* Caching
* Efficient database queries
* Pagination/infinite scrolling
* Minimal unnecessary JavaScript
* Efficient gallery rendering
* Optimized API responses
* Background processing
* Avoiding expensive operations on the application server

Animations should feel smooth without unnecessarily increasing CPU or memory usage.

---

# Existing Infrastructure

An important constraint is that this project already has infrastructure.

The current architecture is:

* Ubuntu Server
* Docker
* Docker Compose
* Next.js
* PostgreSQL
* Caddy
* Local server-side media storage

The database is PostgreSQL.

The application should be designed to work with this existing architecture.

**Do not automatically replace the infrastructure with a hosted backend service.**

If you believe a different architecture would be substantially better, explain why and ask before changing the architecture.

The platform should remain portable and avoid unnecessary vendor lock-in.

---

# Database

We need a properly designed relational database.

Potential entities include:

* User
* Profile
* Role
* Permission
* Media
* MediaVariant
* MediaMetadata
* Category
* Tag
* MediaTag
* Character
* Series
* MediaCharacter
* MediaSeries
* Collection
* CollectionMedia
* Like
* Favorite
* View
* Follow
* Comment
* CommentLike
* Notification
* Conversation
* Message
* Report
* ModerationAction
* Achievement
* Badge
* UserXP
* UserLevel
* AuditLog
* SiteSetting

This is not a final schema.

Before implementation, we should determine:

* Relationships
* Indexes
* Constraints
* Cascades
* Soft deletion
* Audit requirements
* Query patterns
* Data retention
* Denormalization where appropriate
* Trending/ranking data

---

# API / Backend

The application should have a clean backend architecture.

We should plan:

* Authentication
* Authorization
* Media APIs
* Upload APIs
* Search APIs
* Tag APIs
* Character APIs
* Series APIs
* Comment APIs
* Collection APIs
* Follow APIs
* Notification APIs
* Messaging APIs
* Moderation APIs
* Admin APIs
* Analytics APIs

The backend should validate permissions and inputs on every protected operation.

---

# SEO

Public pages should be SEO-friendly.

We should consider:

* Metadata
* Open Graph
* Twitter/X cards
* Canonical URLs
* Sitemap
* Robots.txt
* Structured data where appropriate
* Search engine indexing rules

NSFW content should not accidentally be exposed to search engines if the platform rules require otherwise.

---

# Mobile / Responsive Design

The application must work well on:

* Desktop
* Laptop
* Tablet
* Mobile

The mobile experience should not simply be a shrunken desktop layout.

Navigation, galleries, media viewers, upload workflows, profiles, comments, and admin interfaces should all be designed responsively.

---

# UX States

Every major feature should account for:

* Loading
* Empty
* Error
* Success
* Disabled
* Processing
* Permission denied
* Not found
* Offline/network failure where appropriate

Do not only design the ideal successful state.

---

# Development Strategy

I do not want the entire application generated as one giant implementation.

After the planning stage, we should break development into logical phases.

For example:

1. Architecture and design system
2. Authentication
3. Core database
4. Media pipeline
5. Gallery/homepage
6. Media pages
7. Search/tags/characters/series
8. Profiles
9. Uploading
10. Collections
11. Community features
12. Notifications
13. Messaging
14. Gamification
15. Moderation
16. Admin panel
17. Analytics
18. Security hardening
19. Performance optimization
20. Production deployment

The exact order can change after we discuss dependencies.

Each phase should result in a working part of the application rather than a collection of unfinished mockups.

---

# Important Product Principle

Moonlight Cherry should feel like a **real production platform**, not a UI prototype.

Do not:

* Build everything into one page
* Create fake dashboard widgets without functionality
* Use generic SaaS layouts
* Invent random features just to fill space
* Hide major functionality behind placeholder buttons
* Assume all users are administrators
* Put authorization only in the frontend
* Ignore mobile
* Ignore loading/error/empty states
* Use unrealistic fake data as a substitute for architecture
* Replace the existing infrastructure without discussing it first

The final application should feel cohesive, premium, fast, and purpose-built for anime artwork discovery and community interaction.

---

# What I want from you now

Start by creating a **comprehensive Markdown project plan**.

Before we start coding, identify the decisions that need to be made and ask me the necessary clarifying questions.

Organize the planning process into logical sections such as:

1. Product definition
2. User types and permissions
3. Authentication
4. NSFW/access control
5. Media architecture
6. Upload/processing pipeline
7. Database architecture
8. Search
9. Community features
10. Collections
11. Gamification
12. Moderation
13. Admin panel
14. Security
15. Performance
16. SEO
17. Infrastructure/deployment
18. UI/UX
19. Development phases
20. Open decisions

Do not write application code yet.

The goal is to make the important architectural and product decisions first, then turn the approved plan into the actual application.

@AGENTS.md
