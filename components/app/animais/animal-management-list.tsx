"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { getOwnedAnimals } from "@/lib/queries/owned-animals"

type AnimalItem = Awaited<ReturnType<typeof getOwnedAnimals>>[number]

interface AnimalManagementListProps {
  animals: AnimalItem[]
}

function AnimalPhoto({ animal }: { animal: AnimalItem }) {
  const primary = animal.fotos[0]
  if (primary) {
    return (
      <img
        src={primary.urlFoto}
        alt={`Foto de ${animal.nome}`}
        className="h-10 w-10 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground" aria-hidden="true">
      {animal.nome.charAt(0).toUpperCase()}
    </div>
  )
}

export function AnimalManagementList({ animals }: AnimalManagementListProps) {
  if (animals.length === 0) {
    return <p className="text-muted-foreground">Nenhum animal cadastrado ainda.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table aria-label="Lista de animais gerenciados">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Foto</TableHead>
            <TableHead scope="col">Nome</TableHead>
            <TableHead scope="col">Especie</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Solicitacoes</TableHead>
            <TableHead scope="col">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {animals.map((animal) => (
            <TableRow key={animal.id}>
              <TableCell>
                <AnimalPhoto animal={animal} />
              </TableCell>
              <TableCell className="font-medium">{animal.nome}</TableCell>
              <TableCell>{animal.especie.nome}</TableCell>
              <TableCell>
                <Badge variant="outline">{animal.status}</Badge>
              </TableCell>
              <TableCell>{animal._count.solicitacoes}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/animais/${animal.id}`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    aria-label={`Editar ${animal.nome}`}
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/dashboard/animais/${animal.id}/fotos`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    aria-label={`Fotos de ${animal.nome}`}
                  >
                    Fotos
                  </Link>
                  <Link
                    href={`/dashboard/animais/${animal.id}/saude`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    aria-label={`Saude de ${animal.nome}`}
                  >
                    Saude
                  </Link>
                  <Link
                    href={`/dashboard/animais/${animal.id}/relacionados`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    aria-label={`Animais relacionados a ${animal.nome}`}
                  >
                    Relacionados
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
