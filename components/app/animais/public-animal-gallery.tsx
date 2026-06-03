type PublicAnimalGalleryProps = {
  animalName: string;
  photos: { id: string; urlFoto: string; principal: boolean }[];
};

export function PublicAnimalGallery({ animalName, photos }: PublicAnimalGalleryProps) {
  const primaryPhoto = photos[0];

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] overflow-hidden rounded-md bg-[var(--muted)]">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.urlFoto}
            alt={`Foto principal de ${animalName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
            Sem foto
          </div>
        )}
      </div>
      {photos.length > 1 ? (
        <div className="grid grid-cols-4 gap-2">
          {photos.slice(1).map((photo) => (
            <div key={photo.id} className="aspect-square overflow-hidden rounded-md bg-[var(--muted)]">
              <img src={photo.urlFoto} alt={`Foto de ${animalName}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
