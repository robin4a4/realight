# Realight

Really small react framwork for [Bun](https://bun.sh) to fetch data and mutate them easily, inspired by [Remix](https://remix.run) api's

Can only be used for toy projects and is really far from being production ready (it will never be!).

## Getting started

### Installation

`bun i realight`

### You first route

Realight is based on the file system router that Bun provides which is itself based on the Nextjs Page router.

First create a `views` folder which will contain all the routes, then create a `home.tsx` file. It will create the `/home` url.
 
In each view you have to export a default react component, for example:
```javascript
export default function View() {
    return <p>My first route !</p>
}
```


## APIs

### Loading data

Realight uses the same api than remix to fetch data by asking you to write a special `async` function in the same file as your view:

```javascript

export async function query() {
    const data = await fetch("https://jsonplaceholder.typicode.com/todos")  
    const todos = await data.json() as Array<Record<string, unknown>>
    return {
        title: "Arbitrary data",
        todos,
    };
}
```

From which you can retrieve the content in your view using a special hook: `useQueryData`

```javascript
import {useQueryData} from "realight"

export async function query() {
    const data = await fetch("https://jsonplaceholder.typicode.com/todos")  
    const todos = await data.json() as Array<Record<string, unknown>>
    return {
        title: "Arbitrary data",
        todos,
    };
}

export default function View() {
    const {title, todos} = useQueryData<typeof query>()
    return (
        <article>
            <h1>{title}</h1>
            <ul>
                {todos?.map(todo => {
                    <li key={todo.id}>{todo.title}</li>
                })}
            </ul>
        </article>
    )
}
```

### Mutate data

To mutate data you have to use the `useForm` hook that returns a `Form` component and a `state` react state. 


```javascript
import {useForm} from "realight"

export default function View() {
    const form = useForm() // or const {Form, state} = useForm()
    return (
        <form.Form method="POST">
            <input type="email" name="email " />
            <button type="submit">
                {form.state === "submitting" ? "loading" : "Subscribe to the newsletter !"}
            </button>
        </form.Form>
    )
}
```

To retrieve the form data you can export an async `mutate` function:

```javascript
import {useForm} from "realight"
import {fakeDb} from "fake-db-service"

export default function View() {
    const form = useForm() // or const {Form, state} = useForm()
    return (
        <form.Form method="POST">
            <input type="email" name="email " />
            <button type="submit">
                {form.state === "submitting" ? "loading" : "Subscribe to the newsletter !"}
            </button>
        </form.Form>
    )
}

export async function mutate({ req }: { req: Request }) {
    const formData = req.formData
    const success = await fakeDb.add({
        email: formData.get("email")
    })
    return JsonResponse({success});
}
```

#### Retrieve the result

If you need to retrieve the result of the mutate function in your view you can use the `useMutationData`.


```javascript
import {useForm, useMutationData} from "realight"
import {fakeDb} from "fake-db-service"

export default function View() {
    const form = useForm()
    const {success} = useMutationData<typeof mutate>()
    return (
        <>
            <form.Form method="POST">
                <input type="email" name="email " />
                <button type="submit">
                    {form.state === "submitting" ? "loading" : "Subscribe to the newsletter !"}
                </button>
            </form.Form>
            <p>{success ? "Thank you !" : null}</p>
        </>
    )
}

export async function mutate({ req }: { req: Request }) {
    const formData = req.formData
    const success = await fakeDb.add({
        email: formData.get("email")
    })
    return JsonResponse({success});
}
```


#### Revalidation
If you show some data and then want to update them you can show the `revalidate` option on the response to automaticcaly re-run the query and show the updated data right after the mutation is done without doing anything.

```javascript
import {useForm, useMutationData, useQueryData} from "realight"
import {fakeDb} from "fake-db-service"

export default function View() {
    const form = useForm()
    const {emails} = useQueryData<typeof query>()
    return (
        <>
            {emails?.map(email => (
                <form.Form method="POST">
                    <input type="hidden" name="id" value={email.id}>
                    <input type="email" name="email" value={email.email} />
                    <button type="submit">
                        {form.state === "submitting" ? "loading" : "Update email"}
                    </button>
                </form.Form>
            )}
        </>
    )
}

export async function query() {
    const emails = await fakeDb.get("emails")
    return {emails};
}

export async function mutate({ req }: { req: Request }) {
    const formData = req.formData
    const success = await fakeDb.update(formData.get("id"), {
        email: formData.get("email")
    })
    return JsonResponse({success}, { revalidate: true });
}
```

It allows the view to always be in sync with the data

### Meta data

If you want to change the title description and favicon you can export a `meta` const from your view:

```javascript
import type {Meta} from "realight"

export const meta: Meta = {
    title: "My blog"
    description: "The description of my blog"
    icon: "favicon.png"
}
```
The favicon will be searched in the public folder. If you want to customize your title and description based on the query data you can export a function instead which will have the data passed as an argument:

```javascript
import type {Meta} from "realight"

export const meta: Meta<typeof query> = (data) => {
    title: data.meta.title
    description: data.meta.description
    icon: "favicon.png"
}
```


### Database

If you want to store data in a database you can use the `realight/db` package that exposes a bun sqlite database. You can also use the native bun sqlite db but you'll have to import it dynamically in either the query or mutate function. Using the `realight/db` you'll be able to import it from the top.