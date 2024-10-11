# Problem

The client wants an API endpoint that scrapes a web page, grabs the contents of it, then create a summary of that page using an LLM.

# Technical Specifications

The endpoint needs to be able to do the following steps in order:

1. User provides a URL that will be stored to a queue/database.
2. The app gives an ID of the job created to the user. The user will be responsible for periodically checking if the job is finished.
3. The app loads the URL on a headless browser, grabs the contents, then stores it in memory.
4. Contents are cleaned up by grabbing only text inside <p> tags.
5. Cleaned up content is then sent to a hugging face inference API for summarization.
6. Summary returned by HF will be saved to the database.

# Tech Stack, and why it was chosen

## ExpressJS

This was chosen because it's one of the simplest methods of creating a flexible HTTP server. Anything lower than this would be too much boilerplate. (Node HTTP Server can do the job, but it would be too much boilerplate)

- Prisma ORM

This ORM provides type-safe database querying, which is a nice feature to have so that we don't need to worry if our database model is out of sync as ESLint is able to pick it up. It is also capable of doing a force reset of the SQLite database being used, which is a plus for doing integration testing as we are always able to work with an empty db during the test.

- Puppeteer

I was first considering the use of the nodejs native `fetch`, but I can see why puppeteer is a better choice for this. it's harder to replicate a "valid" page visit with the `fetch` command compared to just actually visiting the page itself on a browser.

# Does the Tech Spec meet the Client's Demand

The tech specs mentioned above does the job of summarizing a web page that the client gives to it. It is able to grab the URL being given by the user, scrape that, give the contents to an LLM, then save it for the user to be able to get.

# Things to Improve

This application is mainly a proof-of-concept. It has some issues that needs addressing, and will need further development for it to be ready for production.

1. Hugging Face Inference API documentation is not that extensive. I keep running into this error, especially for larger documents.

```
There was an inference error: unknown error: INDICES element is out of DATA bounds, id=1026 axis_dim=1026
```

The fixes that the web provides is either related to transformation, or is implementable in python. Further research is needed for this to be taken care of.

2. Using a KV store as a queue would probably be a better way of doing things. The use of the database would mostly be for storing the summary of the URLs being requested.

3. Authorization is nonexistent. This is highly insecure and will probably eat up the daily rate limit of the HF inference requests.

4. This project has no build process, so we are not yet able to deploy this into serverless functions. The only reason we need a build process even though everything is coded in JS is because of using aliases. We can either use rollup to compile the project into a single file or just replace the aliases to the proper paths, which is not recommended especially if more endpoints are needed.

5. We are using local SQLite. For it to be deployed, using a database service such as Turso, Neon, PlanetScale, etc. would be better. It will not be that much of a problem as Prisma is very flexible and can cater a lot of database sources.
