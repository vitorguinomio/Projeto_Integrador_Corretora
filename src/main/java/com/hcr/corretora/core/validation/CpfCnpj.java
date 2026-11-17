package com.hcr.corretora.core.validation;

/**
 * Validação e padronização de CPF/CNPJ (RF30 / RF31).
 * O documento é sempre gravado no formato com máscara (000.000.000-00 ou
 * 00.000.000/0000-00), para que a checagem de duplicidade funcione independente
 * de o usuário ter digitado com ou sem pontuação.
 */
public final class CpfCnpj {

    private CpfCnpj() {
    }

    public static String somenteDigitos(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }

    /** Valida os dígitos verificadores e devolve o documento formatado; lança erro se for inválido. */
    public static String normalizar(String valor) {
        String digitos = somenteDigitos(valor);
        if (digitos.length() == 11) {
            if (!cpfValido(digitos)) {
                throw new IllegalArgumentException("CPF inválido: confira os números digitados.");
            }
            return formatar(digitos);
        }
        if (digitos.length() == 14) {
            if (!cnpjValido(digitos)) {
                throw new IllegalArgumentException("CNPJ inválido: confira os números digitados.");
            }
            return formatar(digitos);
        }
        throw new IllegalArgumentException("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).");
    }

    /** Formata sem validar (usado para comparar com registros antigos). */
    public static String formatar(String valor) {
        String d = somenteDigitos(valor);
        if (d.length() == 11) {
            return d.substring(0, 3) + "." + d.substring(3, 6) + "." + d.substring(6, 9) + "-" + d.substring(9);
        }
        if (d.length() == 14) {
            return d.substring(0, 2) + "." + d.substring(2, 5) + "." + d.substring(5, 8) + "/"
                    + d.substring(8, 12) + "-" + d.substring(12);
        }
        return valor == null ? null : valor.trim();
    }

    static boolean cpfValido(String cpf) {
        if (cpf.chars().distinct().count() == 1) {
            return false; // 000.000.000-00, 111.111.111-11...
        }
        return digitoCpf(cpf, 9) == cpf.charAt(9) - '0' && digitoCpf(cpf, 10) == cpf.charAt(10) - '0';
    }

    private static int digitoCpf(String cpf, int tamanho) {
        int soma = 0;
        for (int i = 0; i < tamanho; i++) {
            soma += (cpf.charAt(i) - '0') * (tamanho + 1 - i);
        }
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }

    static boolean cnpjValido(String cnpj) {
        if (cnpj.chars().distinct().count() == 1) {
            return false;
        }
        int[] pesos1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] pesos2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        return digitoCnpj(cnpj, pesos1) == cnpj.charAt(12) - '0' && digitoCnpj(cnpj, pesos2) == cnpj.charAt(13) - '0';
    }

    private static int digitoCnpj(String cnpj, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += (cnpj.charAt(i) - '0') * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
