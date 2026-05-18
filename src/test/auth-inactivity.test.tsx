import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../hooks/useAuth";

// Mock das dependências externas com funções constantes para resistir a resetações de mocks
vi.mock("@/lib/supabase", () => {
  const getMockSubscription = () => ({
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  });

  return {
    supabase: {
      auth: {
        getSession: vi.fn(() => Promise.resolve({
          data: {
            session: {
              user: { id: "test-user-id", email: "test@example.com" },
              access_token: "mock-token",
            },
          },
          error: null,
        })),
        onAuthStateChange: vi.fn(() => getMockSubscription()),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
      },
    },
  };
});

vi.mock("@/data/api", () => ({
  getProfessionalById: vi.fn(() => Promise.resolve(null)),
}));

describe("Inatividade Auto-Logout", () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    
    // Mock do window.location para evitar problemas com redirecionamento em jsdom
    originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    window.location = {
      ...originalLocation,
      href: "",
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  const TestComponent = () => {
    const { user, signOut } = useAuth();
    return (
      <div>
        <span data-testid="user-status">{user ? "logged-in" : "logged-out"}</span>
        <button data-testid="sign-out-btn" onClick={signOut}>Sign Out</button>
      </div>
    );
  };

  it("deve deslogar o usuário após 1 hora de inatividade completa", async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Espera inicialização da autenticação
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(getByTestId("user-status").textContent).toBe("logged-in");
    expect(localStorage.getItem("saka_last_activity")).toBeDefined();

    // Avança o tempo em 59 minutos (3540000 ms) - não deve deslogar ainda
    await act(async () => {
      await vi.advanceTimersByTimeAsync(59 * 60 * 1000);
    });
    expect(getByTestId("user-status").textContent).toBe("logged-in");

    // Avança mais 2 minutos (totalizando 61 minutos) - deve deslogar
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    });

    expect(getByTestId("user-status").textContent).toBe("logged-out");
    expect(window.location.href).toBe("/");
  });

  it("deve resetar o timer e não deslogar se houver atividade do usuário", async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Espera inicialização
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(getByTestId("user-status").textContent).toBe("logged-in");

    // Avança 30 minutos
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    });
    expect(getByTestId("user-status").textContent).toBe("logged-in");

    // Simula atividade do usuário
    act(() => {
      const event = new MouseEvent("mousedown", { bubbles: true });
      window.dispatchEvent(event);
    });

    // Avança mais 45 minutos (total de 75 minutos desde o início, mas apenas 45 desde a atividade)
    // Se não tivesse resetado, teria deslogado após 60 minutos do início.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(45 * 60 * 1000);
    });
    expect(getByTestId("user-status").textContent).toBe("logged-in");

    // Avança mais 20 minutos (passando de 1 hora da última atividade) - agora deve deslogar
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20 * 60 * 1000);
    });
    expect(getByTestId("user-status").textContent).toBe("logged-out");
  });
});
