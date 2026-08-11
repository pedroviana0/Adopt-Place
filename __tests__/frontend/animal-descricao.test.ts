import { describe, expect, it } from "vitest";

import { descreverAnimal } from "../../frontend/src/lib/animal-descricao";

describe("descrição de espécie e porte no cartão do Feels", () => {
  it("concorda em gênero com o sexo do animal", () => {
    expect(descreverAnimal("Gato", "F", "P")).toBe("Gata pequena");
    expect(descreverAnimal("Gato", "M", "P")).toBe("Gato pequeno");
    expect(descreverAnimal("Cachorro", "F", "M")).toBe("Cachorra média");
    expect(descreverAnimal("Cachorro", "M", "M")).toBe("Cachorro médio");
  });

  it("mantém 'grande' invariável, como manda a língua", () => {
    expect(descreverAnimal("Gato", "F", "G")).toBe("Gata grande");
    expect(descreverAnimal("Cachorro", "M", "G")).toBe("Cachorro grande");
  });

  it("preserva espécie fora do catálogo e concorda no masculino", () => {
    expect(descreverAnimal("Coelho", "F", "P")).toBe("Coelho pequeno");
  });

  it("devolve só o porte quando não há espécie", () => {
    expect(descreverAnimal(null, "F", "P")).toBe("Pequena");
    expect(descreverAnimal(undefined, "M", "G")).toBe("Grande");
  });

  it("não inventa texto quando o porte é desconhecido", () => {
    expect(descreverAnimal("Gato", "F", "XX")).toBe("Gata");
    expect(descreverAnimal(null, "F", "XX")).toBe("");
  });
});
