export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="24" cy="24" r="20" fill="hsl(var(--primary))" />
        <path
          d="M24 8C15.1634 8 8 15.1634 8 24C8 32.8366 15.1634 40 24 40C32.8366 40 40 32.8366 40 24C40 15.1634 32.8366 8 24 8Z"
          stroke="hsl(var(--secondary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 34C28.4183 34 32 30.4183 32 26C32 23.9554 31.1822 22.0935 29.8983 20.7383C28.6144 19.383 26.4183 18 24 18C21.5817 18 19.3856 19.383 18.1017 20.7383C16.8178 22.0935 16 23.9554 16 26C16 30.4183 19.5817 34 24 34Z"
          fill="hsl(var(--secondary))"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
        />
        <path
          d="M24 28V36"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xl font-bold text-foreground">Postos Natureza</span>
    </div>
  );
}
