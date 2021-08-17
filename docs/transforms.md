# Transforms

This document outlines how to use the `TransformService` for data transformations, including how multiple transformations can be piped together for complex data processing workflows.

## Overview

The `TransformService` provides a flexible and powerful mechanism to transform structured data. Transforms can be piped together to apply a sequence of transformations to the input data.

It supports the following operations:
- **Map**: Map fields to new keys and optionally format values.
- **Merge**: Merge source data into target fields.
- **Unwind**: Flatten nested arrays while retaining root context.
- **Pivot**: Pivot data based on a category, value, and grouping criteria.
- **Aggregate**: Group and calculate aggregations such as sum, count, and average.

### **1. `map`**
Maps fields in a dataset to new keys or transforms their values.

- **Input Example**:
  ```json
  [
    { "id": 1, "name": "John", "dob": "1990-01-01" },
    { "id": 2, "name": "Jane", "dob": "1985-05-20" }
  ]
  ```

- **Configuration**:
  ```json
  {
    "id": "id",
    "fullName": "{{name}}",
    "formattedDob": "{{dob|YYYY-MM-DD}}"
  }
  ```

- **Output**:
  ```json
  [
    { "id": 1, "fullName": "John", "formattedDob": "1990-01-01" },
    { "id": 2, "fullName": "Jane", "formattedDob": "1985-05-20" }
  ]
  ```

---

### **2. `unwind`**
Flattens nested arrays within objects and includes the parent data if specified.

- **Input Example**:
  ```json
  [
    {
      "id": 1,
      "name": "Parent",
      "children": [
        { "id": 101, "name": "Child A" },
        { "id": 102, "name": "Child B" }
      ]
    }
  ]
  ```

- **Configuration**:
  ```json
  {
    "path": "children",
    "root": "parent"
  }
  ```

- **Output**:
  ```json
  [
    {
      "id": 101,
      "name": "Child A",
      "parent": { "id": 1, "name": "Parent" }
    },
    {
      "id": 102,
      "name": "Child B",
      "parent": { "id": 1, "name": "Parent" }
    }
  ]
  ```

---

### **3. `pivot`**
Converts rows into columns based on specified keys.

- **Input Example**:
  ```json
  [
    { "category": "A", "value": 10, "date": "2024-01-01" },
    { "category": "B", "value": 20, "date": "2024-01-01" },
    { "category": "A", "value": 15, "date": "2024-01-02" },
    { "category": "B", "value": 25, "date": "2024-01-02" }
  ]
  ```

- **Configuration**:
  ```json
  {
    "path": "category",
    "value": "value",
    "groupBy": ["date"]
  }
  ```

- **Output**:
  ```json
  [
    { "date": "2024-01-01", "A": 10, "B": 20 },
    { "date": "2024-01-02", "A": 15, "B": 25 }
  ]
  ```

---

### **4. `aggregate`**
Groups data and performs aggregations like sum, count, and average.

- **Input Example**:
  ```json
  [
    { "category": "A", "value": 10, "date": "2024-01-01" },
    { "category": "B", "value": 20, "date": "2024-01-01" },
    { "category": "A", "value": 15, "date": "2024-01-02" },
    { "category": "B", "value": 25, "date": "2024-01-02" }
  ]
  ```

- **Configuration**:
  ```json
  {
    "groupBy": ["date"],
    "aggregations": [
      { "field": "value", "type": "sum", "output": "totalValue" },
      { "field": "value", "type": "count", "output": "count" }
    ]
  }
  ```

- **Output**:
  ```json
  [
    {
      "date": "2024-01-01",
      "totalValue": 30,
      "count": 2,
      "items": [
        { "category": "A", "value": 10, "date": "2024-01-01" },
        { "category": "B", "value": 20, "date": "2024-01-01" }
      ]
    },
    {
      "date": "2024-01-02",
      "totalValue": 40,
      "count": 2,
      "items": [
        { "category": "A", "value": 15, "date": "2024-01-02" },
        { "category": "B", "value": 25, "date": "2024-01-02" }
      ]
    }
  ]
  ```

---

### **5. `merge`**
Combines data from a source path into a target path within objects.

- **Input Example**:
  ```json
  {
    "data": { "id": 1, "details": { "name": "John" } },
    "extra": { "age": 30 }
  }
  ```

- **Configuration**:
  ```json
  {
    "source": "extra",
    "target": "data.details"
  }
  ```

- **Output**:
  ```json
  {
    "data": { "id": 1, "details": { "name": "John", "age": 30 } }
  }
  ```

---

## **Usage in Application**

### **Apply Transforms**
To use multiple transforms on data:

- **Code Example**:
  ```typescript
  const data = [
    { category: 'A', value: 10, date: '2024-01-01' },
    { category: 'B', value: 20, date: '2024-01-01' }
  ];

  const transforms = [
    {
      type: 'pivot',
      config: {
        path: 'category',
        value: 'value',
        groupBy: ['date']
      }
    }
  ];

  const result = transformService.apply(data, transforms);
  console.log(result);
  ```

- **Output**:
  ```json
  [
    { "date": "2024-01-01", "A": 10, "B": 20 }
  ]
  ```

This document provides a structured way to leverage `TransformService` for dataset transformation, with configurable methods to cater to diverse scenarios.

## Piped Transformations

Below is an example of how to use multiple transforms in a pipeline:

### Input Data
```json
{
  "code": "A123",
  "skus": [
    { "id": 1, "description": "SKU 1", "date": "2024-01-01", "total": 50 },
    { "id": 1, "description": "SKU 1", "date": "2024-01-02", "total": 20 },
    { "id": 2, "description": "SKU 2", "date": "2024-01-02", "total": 30 }
  ],
  "meta": {
    "list": [
      { "id": 1, "description": "SKU 1"},
      { "id": 2, "description": "SKU 2"},
      { "id": 3, "description": "SKU 3"}
    ]
  }
}
```

### Transform Configuration
```json
{
  "transforms": [
    {
      "type": "merge",
      "config": {
        "source": "meta.list",
        "target": "skus"
      }
    },
    {
      "type": "unwind",
      "config": {
        "path": "skus",
        "root": "job"
      }
    },
    {
      "type": "map",
      "config": {
        "code": "{{code}}",
        "description": "{{skus.description}}",
        "date": "{{skus.date|YYYY-MM-DD}}",
        "total": "{{skus.total}}"
      }
    },
    {
      "type": "pivot",
      "config": {
        "path": "date",
        "value": "total",
        "groupBy": ["code"]
      }
    }
  ]
}
```

### Execution
Call the `apply` method from the `TransformService` with the input data and the transform configuration:

```typescript
const transformedData = transformService.apply(inputData, transformConfig.transforms);
```

### Output Data
```json
[
  {
    "id": 1,
    "2024-01-01": 50,
    "2024-01-02": 20
  },
  {
    "id": 2,
    "2024-01-02": 30
  },
    {
    "id": 3
  }
]
```

### Explanation of the Transform Pipeline

1. **Merge**: Merges `meta.list` into `skus` for each item in the input data.

2. **Unwind**: Expands the `skus` array into individual records, retaining the original item data under the `job` key.

3. **Map**: Maps specific fields (e.g., `code`, `description`, `date`, `total`) into a new structure with optional formatting for dates.

4. **Pivot**: Pivots the data based on `date` and aggregates `total` values grouped by `code`.

For further details on each transform type, refer to the section headers in this document.
