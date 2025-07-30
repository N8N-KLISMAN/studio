export function Logo() {
  return (
    <div className="flex items-center justify-center gap-3">
      <svg
        width="36"
        height="36"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 2C76.5 2 98 23.5 98 50C98 76.5 76.5 98 50 98C23.5 98 2 76.5 2 50C2 23.5 23.5 2 50 2Z"
          fill="url(#paint0_linear_1)"
        />
        <path
          d="M68 20C57 24 50 35 50 35C50 35 43 24 32 20C19 15 15 32 15 32C15 32 20 45 34 51V72C34 72 32 85 50 85C68 85 66 72 66 72V51C80 45 85 32 85 32C85 32 81 15 68 20Z"
          fill="hsl(var(--primary))"
        />
        <path
          d="M50 62C58.2843 62 65 55.2843 65 47C65 43 63 38 59.5 35.5C56 33 50 31 50 31C50 31 44 33 40.5 35.5C37 38 35 43 35 47C35 55.2843 41.7157 62 50 62Z"
          fill="url(#paint1_linear_1)"
        />
        <defs>
          <linearGradient
            id="paint0_linear_1"
            x1="50"
            y1="2"
            x2="50"
            y2="98"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F7B928" />
            <stop offset="1" stopColor="#FCE4A8" />
          </linearGradient>
          <linearGradient
            id="paint1_linear_1"
            x1="50"
            y1="31"
            x2="50"
            y2="62"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F7B928" />
            <stop offset="1" stopColor="#FDD87D" />
          </linearGradient>
        </defs>
      </svg>

      <span className="text-xl font-bold text-foreground">
        <span style={{ color: 'hsl(var(--secondary))' }}>Postos </span>
        <span style={{ color: 'hsl(var(--primary))' }}>Natureza</span>
      </span>
    </div>
  );
}
