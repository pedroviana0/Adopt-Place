"use client"

import { useState, useTransition, useCallback, useRef } from "react"
import { searchAnimalsByName } from "@/lib/actions/animal-search"
import { linkAnimals, unlinkAnimals } from "@/lib/actions/animal-relacionado"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface RelatedAnimal {
  id: string
  nome: string
  fotos: { urlFoto: string; principal: boolean }[]
}

interface SearchResult {
  id: string
  nome: string
  fotos: { urlFoto: string }[]
}

interface RelatedAnimalManagerProps {
  animalId: string
  relatedAnimals: RelatedAnimal[]
}

export function RelatedAnimalManager({ animalId, relatedAnimals: initialRelated }: RelatedAnimalManagerProps) {
  const [relatedAnimals, setRelatedAnimals] = useState<RelatedAnimal[]>(initialRelated)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPendingLink, startLinkTransition] = useTransition()
  const [isPendingUnlink, startUnlinkTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!term.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      const results = await searchAnimalsByName(term)
      setSearchResults(results as unknown as SearchResult[])
      setIsSearching(false)
    }, 300)
  }, [])

  function handleLink(relacionadoId: string) {
    startLinkTransition(async () => {
      const result = await linkAnimals({ animalId, animalRelacionadoId: relacionadoId })
      if (result.success) {
        const found = searchResults.find((r) => r.id === relacionadoId)
        if (found) {
          setRelatedAnimals((prev) => [
            ...prev,
            {
              id: found.id,
              nome: found.nome,
              fotos: found.fotos.map((f) => ({ urlFoto: f.urlFoto, principal: true })),
            },
          ])
        }
        setSearchResults((prev) => prev.filter((r) => r.id !== relacionadoId))
      }
    })
  }

  function handleUnlink(relacionadoId: string) {
    const backup = relatedAnimals
    setRelatedAnimals((prev) => prev.filter((r) => r.id !== relacionadoId))

    startUnlinkTransition(async () => {
      const result = await unlinkAnimals(animalId, relacionadoId)
      if (result.error) {
        setRelatedAnimals(backup)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Buscar animal por nome..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isSearching && <p className="mt-1 text-sm text-muted-foreground">Buscando...</p>}
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {searchResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between rounded-md border p-2">
                <span className="text-sm">{result.nome}</span>
                <Button onClick={() => handleLink(result.id)} disabled={isPendingLink}>
                  Vincular
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Animais relacionados</h3>
        {relatedAnimals.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum animal relacionado.</p>
        )}
        {relatedAnimals.map((related) => (
          <Card key={related.id}>
            <CardContent className="flex items-center justify-between p-3">
              <span className="text-sm font-medium">{related.nome}</span>
              <Button
                variant="destructive"
                onClick={() => handleUnlink(related.id)}
                disabled={isPendingUnlink}
              >
                Desvincular
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
