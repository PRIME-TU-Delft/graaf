# PRIME Grpah Editor

## Preview

https://graaf--preview.netlify.app

## Installation

Create an .env file in the root of the project with the following content:

```env
DATABASE_URL="postgres://user:wachtwoord@localhost:5432/db"

SURFCONEXT_ISSUER="https://connect.test.surfconext.nl"
SURFCONEXT_CLIENT_ID="beta.prime-applets.ewi.tudelft.nl"
SURFCONEXT_CLIENT_SECRET="[ASK YOUR ADMIN TO GET THIS]"

NETLIFY_CONTEXT="DEPLOY_PREVIEW"
```

Then run the following commands:

```bash
npx auth
```

Optional parameters for logging:

```env
DEBUG="true" # for printing server debug info to the console
PRISMA_LOG="none" # or "info", "warn", "error"
```

```bash
# Terminal 1
cd db
podman compose up db # Or docker compose up db

# Terminal 2
pnpm install

pnpm prisma generate # will generate the prisma client
pnpm prisma db push # will setup the database schema
pnpm prisma db seed # will setup the database with some initial data
```

## Usage

```bash
# Terminal 1 - if not already running
cd db
podman compose up # Or docker compose up

# Terminal 2
pnpm dev
```

## Testing

```bash
pnpm test:integration
```

```mermaid
flowchart LR;
	TEST_DB[(Test Database)]
  TEST_DB --> P1["`**ProgramOne**
      +SuperAdmin`"]
  TEST_DB --> P2["`**ProgramTwo**
      +SuperAdmin
      +ProgramAdmin`"]
  TEST_DB --> P3["`**ProgramThree**
      +SuperAdmin
      +ProgramEditor`"]

  C1["`**CourseOne**
      +SuperAdmin`"]
  C2["`**CourseTwo**
      +SuperAdmin
      +CourseAdmin`"]
  C3["`**CourseThree**
      +SuperAdmin
      +CourseEditor`"]


  P1 ==> C1 & C2 & C3
  P2 & P3 --> C1 & C2 & C3

  C1 -->G1
  C2-->G2["GraphTwo"]
  C3-->G3["GraphThree"]

  G2 & G3 --> A
  A@{ shape: braces, label: "GraphTwo & GraphThree have the same content as GraphOne as a copy (not reference)" }

  subgraph G1["GraphOne"]
    D1["DomainOne"]-->D2["DomainTwo"]-->D3["DomainThree"]
    S3["SubjectThree"] --> S2["SubjectTwo"] --> S1["SubjectOne"]

    S1 & S2 ==> D1
    S3 ==> D2
  end
```
