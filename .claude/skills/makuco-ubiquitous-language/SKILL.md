---
name: 'makuco-ubiquitous-language'
description: 'Makuco Ubiquitous Language Skill, responsible for defining and maintaining a ubiquitous language for the project, ensuring that all team members share a common vocabulary and understand the terms and concepts used in the project.'
---

# Makuco Ubiquitous Language

This skill is responsible for defining and maintaining a ubiquitous language for the project, ensuring that all team members share a common vocabulary and understand the terms and concepts used in the project.
Utilize it when defining terms, concepts, entities, actions, and other elements of the project's domain, ensuring that they are clear, consistent, and understood by all team members.

## Principles of Ubiquitous Language

    1. All important business terms should have a unique, stable name that is shared between product, business, and engineering.

    2. If a business term does not exist in the code, the model is wrong.

    3. If the code uses terms that the business does not recognize, the nomenclature used in the code and in the model is wrong.

    4. The code should use the same terms as the business, and the business should use the same terms as the code. If the business says "Pedido de Venda" in Portuguese, the code should say "Order" (in English), because it's the correct name in the business context, in the native language. And the architecture documents, source code, database tables, and documentation should clearly map this.

## Makuco Rules for Ubiquitous Language

- The domain speaks English in the code (classes, methods, variables, etc).

## Examples of translating business terms to ubiquitous language

| Business Term | Ubiquitous Language Term | Justification |
| --- | --- | --- |
| Cliente | Customer | Avoid "client" to prevent confusion with "client" in the software context. |
| Pedido de Venda | Order | "Order" is the most common and recognized term to represent a sales order in English. |
| Fatura | Invoice | "Invoice" is the most common and recognized term to represent an invoice in English. |
| Produto | Product | "Product" is the most common and recognized term to represent a product in English. |
| Categoria de Produto | ProductCategory | "ProductCategory" is a clear and specific term to represent a product category. |
| Vencimento do Pedido | OrderDueDate | "OrderDueDate" is a clear and specific term to represent the due date of an order. |

## Naming Conventions for Ubiquitous Language

### Entities (Core Business Concepts)

- Always singular.
- Compound names
- Pascal Case (ex: Product, Customer, OrderItem).

### Aggregates (Grouping of related entities)

- Always singular.
- Pascal_Case + Snake_Case
- Ex: Order_Item, FreightContract, Product_Catalog.

### Attributes

- Always singular.
- Do not use prefixes.
- PascalCase
- Ex: FreightCharge, RoomNumber...

### Methods, Functions, and Services

- Verb + Object
- PascalCase
- Ex: PlaceOrder, CalculateFreightCharge, GetCustomerById.

### Business Events

- Verb in past tense + Object
- PascalCase
- Ex: OrderPlaced, CustomerRegistered, ProductOutOfStock.

### REST APIs

- Noun in plural for resources (ex: /customers, /orders).
- Kebab-case
- Examples: GET /api/orders/pending-payments, POST /api/order-items

### Variables

- camelCase
- Ex: orderTotal, customerName, productPrice.

## Checklist to ensure the consistency of the ubiquitous language

- [ ] Avoid including data types or technical information in the nomenclature, except if there is a well-defined strategy in the business context.
- [ ] Avoid abbreviations, whenever possible, only use abbreviations that are common in the business context. Example: SKU, API, ID...
- [ ] A term with two different names, if "OrderDueDate" exists, do not create "DueAt" elsewhere.
- [ ] Avoid synonyms for business terms.
- [ ] Avoid creating names with technical abstractions.
- [ ] Avoid creating names using analogies from other contexts.
- [ ] No abbreviations in the domain: cust, prd, ord, inv... (Only if it is a universal and documented standard)
- [ ] Exception names = broken rule: OrderCannotBeCancelledException, InvalidTaxIdException, CustomerNotFoundException.
