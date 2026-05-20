import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { Button } from "./button.js";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form.js";
import { Input } from "./input.js";

const schema = z.object({
  email: z.string().email("invalid email"),
});

type FormValues = z.infer<typeof schema>;

interface SampleFormProps {
  onValid?: (values: FormValues) => void;
}

function SampleForm({ onValid }: SampleFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onValid?.(values))}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

describe("Form (react-hook-form + zodResolver)", () => {
  it("valid email submit → onValid 호출 + values 전달", async () => {
    const onValid = vi.fn();
    render(<SampleForm onValid={onValid} />);

    const input = screen.getByLabelText("Email");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(onValid).toHaveBeenCalledWith({ email: "test@example.com" });
    });
  });

  it("invalid email submit → FormMessage 에 error 표시 + onValid 미호출", async () => {
    const onValid = vi.fn();
    render(<SampleForm onValid={onValid} />);

    const input = screen.getByLabelText("Email");
    fireEvent.change(input, { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByText("invalid email")).toBeInTheDocument();
    });
    expect(onValid).not.toHaveBeenCalled();
  });
});
