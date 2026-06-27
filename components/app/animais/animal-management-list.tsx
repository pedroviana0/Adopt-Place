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
        alt={animal.nome}
        className="h-10 w-10 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
      {animal.nome.charAt(0).toUpperCase()}
    </div>
  )
}

export function AnimalManagementList({ animals }: AnimalManagementListProps) {
  if (animals.length === 0) {
    return <p className="text-muted-foreground">Nenhum animal cadastrado ainda.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Foto</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Espécie</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Solicitações</TableHead>
          <TableHead>Ações</TableHead>
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
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/animais/${animal.id}`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Editar
                </Link>
                <Link
                  href={`/dashboard/animais/${animal.id}/fotos`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Fotos
                </Link>
                <Link
                  href={`/dashboard/animais/${animal.id}/saude`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Saúde
                </Link>
                <Link
                  href={`/dashboard/animais/${animal.id}/relacionados`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Relacionados
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
