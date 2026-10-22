# Rockeskolen school access model

## Authority

Feide authenticates the identity and supplies verified school and group data.
Rockeskolen is authoritative for contracts, package capacity and access.
Authentication by Feide alone never grants premium access.

## Access matrix

| User | Public content | Free content | Premium content | Seat usage |
|---|---:|---:|---:|---:|
| Anonymous | Yes | No | No | None |
| Free account | Yes | Yes | No | None |
| Private VIP | Yes | Yes | Yes | Private subscription |
| Student in approved class/school | Yes | Yes | Yes | One unique student seat |
| Teacher in approved class/school | Yes | Yes | Yes | Teacher seat, if limited |
| School manager | Yes | Yes | Yes | Manager/teacher seat |
| Drupal administrator | Yes | Yes | Yes | None |

## Packages

Package limits are defaults. A contract may override them without creating a
new product.

| Code | Scope | Students | Teachers |
|---|---|---:|---:|
| `small_class` | Class | 10 | 10 |
| `class` | Class | 24 | 10 |
| `large_class` | Class | 50 | 15 |
| `school_200` | School | 200 | Unlimited |
| `school_500` | School | 500 | Unlimited |
| `school_1000` | School | 1,000 | Unlimited |
| `school_2500` | School | 2,500 | Unlimited |

## Identity rules

- Schools use the stable Feide/NSR organization-unit identifier, such as
  `NO987654321`, extracted from the verified school or basis-group object.
- Classes use the stable Feide group identifier plus the school identifier.
- Display names such as `8B` are labels and never authorization keys.
- Student capacity counts distinct Feide subject hashes per contract.
- A user already assigned to an active contract keeps access when the contract
  is exactly at capacity. New assignments fail closed.
- Unknown affiliations, inactive schools, expired contracts and missing group
  mappings fail closed.
- Private Stripe grants and school grants remain independent sources.

## Rollout

1. Apply the schema in staging.
2. Register schools and contracts.
3. Import and approve Feide basis groups for class contracts.
4. Obtain the `groups-edu` scope and synchronize `/me/groups` or provision
   organization groups. Only verified API responses may be normalized and
   sent to the entitlement resolver.
5. Run the access matrix for anonymous, free, VIP, student, teacher, manager
   and administrator accounts.
6. Migrate existing Feide users before disabling the legacy Feide grant in
   production.

## Staging test pair

Feide's public test realm contains users at Bjerke grunnskole
(`NO876326126`). The first end-to-end school-package test uses:

- Teacher: `anne123teacher`
- Student: `alexander123elev`
- School: Bjerke grunnskole

The Feide service must explicitly allow the `testusers.feide.no` realm and
request the `groups-edu` scope. The staging fixture creates a temporary
`school_200` contract. This pair verifies school-wide access. A separate pair
with a shared published basis group is required for the class-only test.
