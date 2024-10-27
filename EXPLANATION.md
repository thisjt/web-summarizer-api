# Problem

The client wants an API endpoint that scrapes a web page, grabs the contents of it, then create a summary of that page using an LLM.

# Technical Specifications

The endpoint needs to be able to do the following steps in order:

1. User provides a URL that will be stored to a queue/database.
2. The app gives an ID of the job created to the user. The user will be responsible for periodically checking if the job is finished.
3. The app loads the URL on Cloudflare's Browser Renderer API, grabs the contents, then stores it in memory.
4. Contents are cleaned up by grabbing only text inside &lt;p> tags.
5. Cleaned up content is then sent to Cloudflare AI for summarization.
6. Summary returned by Cloudflare AI will be saved to the database.

# Tech Stack, and why it was chosen

## Hono

This was chosen as I have recently experimented on Hono's OpenAPI integration and saw the potentials of how easy it is to create documented routes. I also wanted to show off how fast I am at learning new API frameworks, especially on ones that has amazing developer experience.

## Prisma ORM

This ORM provides type-safe database querying, which is a nice feature to have so that we don't need to worry if our database model is out of sync as ESLint is able to pick it up. It's Cloudflare D1 migration is not as easy as how you usually reset or migrate a database, but there's proper documentation for it so it's not that bad. You'll just be commiting more than just the Prisma schema when you want to do changes.

## Puppeteer (Cloudflare's Fork)

I was first considering the use of the nodejs native `fetch`, but I can see why puppeteer is a better choice for this. it's harder to replicate a "valid" page visit with the `fetch` command compared to just actually visiting the page itself on a browser. Cloudflare's fork of puppeteer still works the same, but can run on their servers instead for easier integration.

# Does the Tech Spec meet the Client's Demand

The tech specs mentioned above does the job of summarizing a web page that the client gives to it. It is able to grab the URL being given by the user, scrape that, give the contents to an LLM, then save it for the user to be able to get.

# Things to Improve

This application is mainly a proof-of-concept. It has some issues that needs addressing, and will need further development for it to be ready for production.

~~1. Hugging Face Inference API documentation is not that extensive. I keep running into this error, especially for larger documents.~~

~~`There was an inference error: unknown error: INDICES element is out of DATA bounds, id=1026 axis_dim=1026`~~

~~The fixes that the web provides is either related to transformation, or is implementable in python. Further research is needed for this to be taken care of.~~

_This was solved by switching to Cloudflare's AI API._

~~2. Using a KV store as a queue would probably be a better way of doing things. The use of the database would mostly be for storing the summary of the URLs being requested.~~

_We are keeping the use of a database. SQLite is more than capable of handling heavy server loads, especially now that we're using Cloudflare's D1 Database which scales well_

~~3. Authorization is nonexistent. This is highly insecure and will probably eat up the daily rate limit of the HF inference requests.~~

_Integrated a basic token authorization, it's implementation is basic only as it will be for demo purposes_

~~4. This project has no build process, so we are not yet able to deploy this into serverless functions. The only reason we need a build process even though everything is coded in JS is because of using aliases. We can either use rollup to compile the project into a single file or just replace the aliases to the proper paths, which is not recommended especially if more endpoints are needed.~~

_Integrated as Cloudflare Workers [summarizer.thisjt.me](https://summarizer.thisjt.me)_

~~5. We are using local SQLite. For it to be deployed, using a database service such as Turso, Neon, PlanetScale, etc. would be better. It will not be that much of a problem as Prisma is very flexible and can cater a lot of database sources.~~

_We're now using Cloudflare D1 as our database_

~~6. The lint and integration test runs for 1 minute due to the development server timeout set during testing. Locally, it only ran for around 20~30 seconds and exited gracefully. Concurrently probably has an issue with SIGTERM not being able to propagate to the running development server in Github Actions.~~

_We're only running lint tests. Will implement integration tests later._

In order to save Cloudflare AI API calls, it would be a good addition to have an option for the user to provide a timestamp or a flag to fetch from database the summary if it already exists. It is possible that that URL has already been requested by a different user before. As long as the user requesting that URL does not need the latest summary of that page, then the result in the db would most likely suffice without re-scraping the page.

My implementation of this for this application needs some work, especially on the classes inside `src/lib/summarizer/*`. The classes created and injected is inefficient as I am extending the entire Summarizer class to a new class, and then injecting it back to the Summarizer class. Isolating the required variables during initialization and putting it in a different class for that to be extended would be the better call here, so that the entire class does not get duplicated.

# Other Things for Discussion

There are some comments sprinkled on the source code. However, the code is written in a way so that everything is self-explanatory and does not require comments for clarification.

# Approaching the Problem

Knowing the requirements of a client is of utmost importance. Everything needs to be known first on what they really want with the project, which is especially hard if the client does not fully know what he needs. Which is why I need to be flexible with how I approach a problem. Mostly it is driven first by experience on the various technologies that can make things possible, and a lot of research regarding specific topics.

In this case, I have already tried out puppeteer, but its use for me is more towards browser testing and not scraping. It's a good thing the assessment provided a suggestion of using this, or I could have steered in a different direction, possibly going towards using `fetch` and `JSDOM`, which would be much harder, although that does make it less dependent on an actual browser for rendering.

For Prisma, not much reason, it's usually my go-to solution when I need a database/ORM.

Dependency Injection is such a very nice mindset to have, as you can isolate individual modules and test them one by one by mocking. It's also possible to have multiple similar modules that you can swap on each other depending on the situation or input.

~~I was originally debating whether to use `hono` or `express`, but I eventually settled to using express as I'm way more familiar to it compared to hono. Hono has a lot more fancy plugins compared to express, but express is just easier to use and implement in my opinion. Maybe in the future when I have a bit more time, I'll play with it.~~

_We're now using hono with the OpenAPI plugin/middleware_

---

# Update 1

Converted JavaScript files to TypeSript files. I realized there's no point in flexing my JSDoc skills. It was fun though.

I want to upload this script as a Cloudflare Worker for it to be demo-able, but their [browser rendering service](https://developers.cloudflare.com/browser-rendering/) (which uses puppeteer under the hood) is a paid plan.

You might have wondered why I almost always only have `main` and `develop` branches. It's because since I am a solo developer, I usually just push all of my commits to the `develop` branch, and do a PR to `main` when I have multiple commits already. I usually do the PR when a minor/major feature gets finished, and I almost always make sure that what I PR to `main` is stable and does not have any issues. Github action is a nice tool that does it for me.

# Update 2

I have now implemented this as a Cloudflare Worker. You may check it out here in this URL: [summarizer.thisjt.me](https://summarizer.thisjt.me). You may check the implementation/code in the `hono-refactor` branch.
