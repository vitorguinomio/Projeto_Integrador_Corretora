# Padrões de Código Java 21, Records, DTOs e Validação

## 1. Padrões Java 21 e Spring Boot 3
- Versão mínima do JDK: **Java 21 LTS**.
- Versão do framework: **Spring Boot 3.x**.
- Pacotes base: `com.hcr.corretora.*`.

---

## 2. DTOs (Data Transfer Objects)
- **Estritamente Java Records**: Todos os DTOs de entrada e saída devem ser modelados como `record`.
- Imutabilidade e concisão: Não use classes tradicionais com getters/setters manuais para DTOs.
- Validação declarativa: Utilize as anotações do pacote `jakarta.validation.constraints.*` nos campos do record:
  - `@NotBlank`, `@NotNull`, `@Size`, `@Email`, `@PositiveOrZero`, etc.

Exemplo:
```java
package com.hcr.corretora.features.clientes.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ClienteRequest(
    @NotBlank(message = "O nome é obrigatório")
    String nome,

    @NotBlank(message = "O CPF/CNPJ é obrigatório")
    String cpfCnpj,

    @Email(message = "E-mail inválido")
    String email,

    String telefone
) {}
```

---

## 3. Entidades JPA
- Toda entidade deve ser mapeada com `@Entity` e `@Table(name = "nome_tabela")`.
- Identificador padrão com estratégia `GenerationType.IDENTITY`:
  ```java
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  ```
- Nomes de colunas explícitos se divergirem do padrão camelCase/snake_case via `@Column(name = "...")`.
- Construtor padrão protegido/público e construtor com campos para uso seguro.

---

## 4. Controllers e Tratamento de Erros
- Controllers devem delegar regras de negócio para os Services.
- Validação obrigatória nos métodos com `@Valid @RequestBody`.
- Retornos encapsulados em `ResponseEntity<?>` com HTTP status code semântico (`200 OK`, `201 Created`, `204 No Content`).
- Erros capturados e padronizados de forma centralizada pelo `GlobalExceptionHandler` anotado com `@RestControllerAdvice`.
- Injeção de dependências **sempre** via construtor (evite `@Autowired` em atributos de campo).
