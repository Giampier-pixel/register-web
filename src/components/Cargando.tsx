export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="cargando" role="status">
      <div className="peonza" />
      <span>{texto}</span>
    </div>
  );
}
