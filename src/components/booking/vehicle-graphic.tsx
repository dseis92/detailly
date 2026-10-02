import { useId } from "react";

const silhouettes: Record<
  string,
  {
    body: string;
    windows: string;
    color: string;
    highlight: string;
    wheels: [number, number];
    roof: string;
  }
> = {
  sedan: {
    body: "M27 91Q27 81 39 78L76 73 99 48Q104 44 112 44H151Q159 45 167 51L192 74 218 79Q231 82 232 93V104Q232 110 222 110H37Q27 110 27 101Z",
    windows: "M88 72L107 50H128V72ZM134 50H149L174 72H134Z",
    color: "#f36f69",
    highlight: "#ffb4a2",
    wheels: [68, 193],
    roof: ""
  },
  suv: {
    body: "M26 90L35 75 71 70 90 35Q94 29 103 29H166Q175 29 181 41L196 70 220 77Q230 80 231 92V107H31Z",
    windows: "M81 68L99 36H123V68ZM129 36H162L178 68H129Z",
    color: "#40a997",
    highlight: "#a2e5c5",
    wheels: [65, 194],
    roof: "M96 25H159"
  },
  truck: {
    body: "M23 87L34 71 58 67V36Q58 31 66 31H132Q139 31 145 43L161 69H230V103Q230 109 221 109H29Q23 109 23 99Z",
    windows: "M65 39H93V65H65ZM100 39H129L144 65H100Z",
    color: "#6c96da",
    highlight: "#b8d5ff",
    wheels: [63, 192],
    roof: "M162 67H229V76H162"
  },
  large: {
    body: "M17 90L29 71 59 66V28Q59 21 70 21H181Q189 21 195 36L209 69 230 77Q240 81 240 94V112H23Z",
    windows: "M68 30H107V64H68ZM114 30H151V64H114ZM158 30H177L192 64H158Z",
    color: "#da9c39",
    highlight: "#ffdf98",
    wheels: [59, 204],
    roof: "M73 17H175"
  }
};
export function VehicleGraphic({ shape = "sedan" }: { shape?: string }) {
  const id = useId().replace(/:/g, "");
  const car = silhouettes[shape] ?? silhouettes.sedan!;
  return (
    <svg
      viewBox="0 0 260 150"
      aria-hidden="true"
      focusable="false"
      className={`car-art ${shape}`}
    >
      <defs>
        <linearGradient id={`body-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={car.highlight} />
          <stop offset="1" stopColor={car.color} />
        </linearGradient>
        <linearGradient id={`glass-${id}`} x2="1" y2="1">
          <stop stopColor="#446070" />
          <stop offset="1" stopColor="#243940" />
        </linearGradient>
      </defs>
      <ellipse
        className="vehicle-shadow"
        cx="130"
        cy="128"
        rx="106"
        ry="7"
        fill="#22313b"
        opacity=".1"
      />
      <g className="vehicle-chassis">
        <path
          d={car.roof}
          stroke="#33444d"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={car.body}
          fill={`url(#body-${id})`}
          stroke={car.color}
          strokeWidth="2"
        />
        <path d={car.windows} fill={`url(#glass-${id})`} />
        <path d="M47 91H215" stroke="#fff" strokeOpacity=".3" strokeWidth="2" />
        <path
          d={shape === "truck" ? "M153 75V98M96 73V98" : "M130 77V98"}
          stroke="#253c49"
          strokeOpacity=".22"
          strokeWidth="2"
        />
        <path
          d={shape === "truck" ? "M102 78H110" : "M143 81H151"}
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="222" y="85" width="10" height="7" rx="3" fill="#fff0b1" />
        <rect x="28" y="87" width="5" height="7" rx="2" fill="#ff465c" />
        <path
          d="M29 105H230"
          stroke="#253841"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {car.wheels.map((x) => (
          <g
            key={x}
            className="vehicle-wheel"
            style={{ transformOrigin: `${x}px 110px` }}
          >
            <circle
              cx={x}
              cy="110"
              r={shape === "large" ? 19 : 17}
              fill="#24343d"
            />
            <circle cx={x} cy="110" r="11" fill="#dce7ed" />
            <path
              d={`M${x} 102V118M${x - 8} 110H${x + 8}M${x - 6} 104L${x + 6} 116M${x + 6} 104L${x - 6} 116`}
              stroke="#829aa7"
              strokeWidth="2"
            />
            <circle cx={x} cy="110" r="3" fill="#536c79" />
          </g>
        ))}
        <path d="M101 55L112 55 97 69H86Z" fill="white" opacity=".16" />
      </g>
      <g
        className="vehicle-sparkle"
        fill="none"
        stroke={car.color}
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M217 30V44M210 37H224" />
        <path d="M41 45V53M37 49H45" />
      </g>
    </svg>
  );
}
