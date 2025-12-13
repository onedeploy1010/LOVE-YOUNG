import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  content: string;
  productType: string;
  avatar?: string;
  index: number;
}

export function TestimonialCard({
  name,
  content,
  productType,
  avatar,
  index,
}: TestimonialCardProps) {
  const initials = name.slice(0, 1);

  return (
    <Card
      className="p-6 md:p-8 relative overflow-visible"
      data-testid={`card-testimonial-${index}`}
    >
      <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-12 h-12 border-2 border-border">
          {avatar ? (
            <AvatarImage src={avatar} alt={name} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4
            className="font-semibold text-foreground"
            data-testid={`text-testimonial-name-${index}`}
          >
            {name}
          </h4>
          <p
            className="text-sm text-muted-foreground"
            data-testid={`text-testimonial-product-${index}`}
          >
            {productType}
          </p>
        </div>
      </div>
      <p
        className="text-base text-foreground/90 leading-relaxed"
        data-testid={`text-testimonial-content-${index}`}
      >
        "{content}"
      </p>
    </Card>
  );
}
