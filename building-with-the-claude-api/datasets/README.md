# Evaluation Datasets

These datasets are used to evaluate prompts that generate code in **bash**, **java**, and **javascript**.

## Generation Prompt

The following prompt was used to generate the datasets:

> There are three dataset files inside the `datasets` directory, regarding programming languages: bash, Java, and JavaScript, which are currently empty.
>
> I want you to generate an evaluation dataset for a prompt evaluation. The dataset will be used to evaluate prompts that generate bash, Java, and JavaScript specifically for programming-related tasks. Generate an array of JSON objects, each representing a task that requires bash, Java, and JavaScript to complete.
>
> - Focus on tasks that can be solved by writing a single bash, Java, and JavaScript function
> - Focus on tasks that do not require writing much code
>
> Please generate 5 objects for each and write them.

## Structure

Each dataset is a JSON array of objects with the following shape:

```json
[
  {
    "task": "Description of task"
  }
]
```

## Files

| File                 | Language   |
|----------------------|------------|
| `ds-bash.json`       | Bash       |
| `ds-java.json`       | Java       |
| `ds-javascript.json` | JavaScript |
