export const PASSWORD_REQUIREMENTS = {
	minLength: 8,
	hasUpperCase: /[A-Z]/,
	hasLowerCase: /[a-z]/,
	hasNumber: /[0-9]/,
};

export function generateStrongPassword(): string {
	const sets = [
		{ chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", regex: PASSWORD_REQUIREMENTS.hasUpperCase },
		{ chars: "abcdefghijklmnopqrstuvwxyz", regex: PASSWORD_REQUIREMENTS.hasLowerCase },
		{ chars: "0123456789", regex: PASSWORD_REQUIREMENTS.hasNumber },
		{ chars: "!@#$%&*", regex: /./ } // Símbolos opcionais, mas recomendados
	];

	let password = "";

	// 1. Garante pelo menos um caractere de cada categoria obrigatória
	sets.forEach(set => {
		password += set.chars.charAt(Math.floor(Math.random() * set.chars.length));
	});

	// 2. Preenche o restante até atingir o minLength (ou mais)
	const allChars = sets.map(s => s.chars).join("");
	while (password.length < PASSWORD_REQUIREMENTS.minLength) {
		password += allChars.charAt(Math.floor(Math.random() * allChars.length));
	}

	// 3. Embaralha a string para que os primeiros caracteres não sejam previsíveis
	return password.split('').sort(() => 0.5 - Math.random()).join('');
}
