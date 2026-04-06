import Logo from "../../assets/satis-logo.png";

export default function ApplicationLogo({ className = "", ...props }) {
    return (
        <img
            src={Logo}
            alt="SATIS"
            className={`rounded-full object-cover ${className}`.trim()}
            {...props}
        />
    );
}
